import z from "zod";

export const paginateSchema = z.object({
  lastId: z.string().optional(),
  lastCreatedAt: z.coerce.date().optional(),
})