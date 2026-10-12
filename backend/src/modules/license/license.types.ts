export interface CreateLicenseDto {
  email: string
  product_id: string
  plan: string
  plan_tier: string
  max_devices: number
  expires_at: Date
}
