import { api } from '@/src/shared/api/axios'

const withToken = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

export const billingService = {
  cancelSubscription: async (subscriptionId: string, token: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/billing/subscriptions/${subscriptionId}`, withToken(token))
    return res.data
  },
}
