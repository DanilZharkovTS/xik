import { prisma } from '../../shared/database/prisma.js'
import { ApiError } from '../../shared/utils/ApiError.js'
import { CreateLicenseDto, LicenseDto } from './license.types.js'

export const licenseService = {
  getLicense: async (data: CreateLicenseDto): Promise<LicenseDto> => {
    let baseUrl = (
      process.env.LICENSE_SERVICE_URL || 'http://localhost:8765'
    ).replace(/\/$/, '')
    const secret = process.env.LICENSE_SERVICE_ADMIN_SECRET || ''

    const fetchLicense = async (url: string) => {
      return fetch(`${url}/admin/licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify(data),
      })
    }

    try {
      console.log(
        '[LicenseService] Requesting license from:',
        `${baseUrl}/admin/licenses`,
        data
      )

      let response: Response
      try {
        response = await fetchLicense(baseUrl)
      } catch (fetchErr) {
        if (baseUrl.includes('host.docker.internal')) {
          baseUrl = baseUrl.replace('host.docker.internal', 'localhost')
          response = await fetchLicense(baseUrl)
        } else {
          throw fetchErr
        }
      }

      let result = await response.json().catch(() => null)
      console.log(`[LicenseService] Response (${response.status}):`, result)

      // If product does not exist in license service, automatically create it and retry
      if (
        (response.status === 404 || result?.error === 'product_not_found') &&
        data.product_id
      ) {
        console.log(
          `[LicenseService] Product ${data.product_id} not found in license service. Attempting auto-registration...`
        )
        const product = await prisma.product.findUnique({
          where: { id: data.product_id },
        })

        if (product) {
          try {
            const createProductRes = await fetch(`${baseUrl}/admin/products`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': secret,
              },
              body: JSON.stringify({
                id: product.id,
                name: product.name,
                description: product.shortDescription || product.name,
              }),
            })
            console.log(
              `[LicenseService] Auto-registered product ${product.id} status:`,
              createProductRes.status
            )

            response = await fetchLicense(baseUrl)
            result = await response.json().catch(() => null)
            console.log(
              `[LicenseService] Retry Response (${response.status}):`,
              result
            )
          } catch (regErr) {
            console.error('[LicenseService] Failed to auto-register product:', regErr)
          }
        }
      }

      if (!response.ok || !result || result?.error || result?.success === false || !result?.key) {
        const message = result?.message || result?.error || response.statusText
        throw ApiError(
          response.status || 502,
          'LICENSE_SERVICE_ERROR',
          message || 'Failed to create license'
        )
      }

      return result
    } catch (err) {
      if ((err as any)?.status) {
        throw err
      }
      console.error('[LicenseService] Failed to get license:', err)
      throw ApiError(
        502,
        'LICENSE_SERVICE_UNREACHABLE',
        err instanceof Error ? err.message : String(err)
      )
    }
  },
  getLicenseById: async (licenseId: number | string): Promise<LicenseDto> => {
    try {
      let baseUrl = (
        process.env.LICENSE_SERVICE_URL || 'http://localhost:8765'
      ).replace(/\/$/, '')
      const secret = process.env.LICENSE_SERVICE_ADMIN_SECRET || ''

      console.log(
        '[LicenseService] Fetching license from:',
        `${baseUrl}/admin/licenses/${licenseId}`
      )

      let response: Response
      try {
        response = await fetch(`${baseUrl}/admin/licenses/${licenseId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': secret,
          },
        })
      } catch (fetchErr) {
        if (baseUrl.includes('host.docker.internal')) {
          baseUrl = baseUrl.replace('host.docker.internal', 'localhost')
          response = await fetch(`${baseUrl}/admin/licenses/${licenseId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-secret': secret,
            },
          })
        } else {
          throw fetchErr
        }
      }

      const result = await response.json()
      console.log(`[LicenseService] Response (${response.status}):`, result)

      if (!response.ok || result?.error || result?.success === false) {
        const message = result?.message || result?.error || response.statusText
        if (response.status === 404 || result?.error === 'license_not_found') {
          throw ApiError(404, 'LICENSE_NOT_FOUND', message || 'License not found')
        }
        throw ApiError(
          response.status || 502,
          'LICENSE_SERVICE_ERROR',
          message || 'Failed to fetch license'
        )
      }

      return result
    } catch (err) {
      if ((err as any)?.status) {
        throw err
      }
      console.error('[LicenseService] Failed to get license by id:', err)
      throw ApiError(
        502,
        'LICENSE_SERVICE_UNREACHABLE',
        err instanceof Error ? err.message : String(err)
      )
    }
  },
}

