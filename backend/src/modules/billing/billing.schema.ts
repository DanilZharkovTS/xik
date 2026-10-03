import z from "zod";

export const checkoutSessionSchema = z.object({
  productId: z.string(),
  // Мова сторінки, з якої почалась оплата: від неї залежать мова Stripe Checkout і адреса повернення.
  locale: z.enum(['en', 'es', 'uk']).default('en'),
})

//dto

export type CheckoutSessionDto = z.infer<typeof checkoutSessionSchema>