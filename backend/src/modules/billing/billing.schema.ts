import z from "zod";

export const checkoutSessionSchema = z.object({
  productId: z.string(),
})

//dto

export type CheckoutSessionDto = z.infer<typeof checkoutSessionSchema>