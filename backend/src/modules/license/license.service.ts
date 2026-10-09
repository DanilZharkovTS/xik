import { ApiError } from '../../shared/utils/ApiError.js'
import { CreateLicenseDto } from './license.types.js'

export const licenseService = {
  getLicense: async (data: CreateLicenseDto) => {
    try {
      const license = await fetch(
        `${process.env.LICENSE_SERVICE_URL}/admin/licenses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': process.env.LICENSE_SERVICE_ADMIN_SECRET || '',
          },
          body: JSON.stringify(data),
        }
      )

      const result = await license.json()

      return result
    } catch (err) {
      throw ApiError(
        502,
        'LICENSE_SERVICE_UNREACHABLE',
        err instanceof Error ? err.message : String(err)
      )
    }
  },
}
