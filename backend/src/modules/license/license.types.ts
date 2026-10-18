export interface CreateLicenseDto {
  email: string
  product_id: string
  plan: string
  plan_tier: string
  max_devices: number
  expires_at: Date
}

export interface LicenseDto {
  id: number
  key: string
  email?: string
  product_id?: string
  plan?: string
  plan_tier?: string
  valid?: boolean
  is_active?: boolean
  expires_at?: string
  created_at?: string
  [key: string]: any
}

