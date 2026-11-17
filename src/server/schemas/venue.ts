import { z } from "zod";

export const VenueListQuerySchema = z.object({
  building: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const VenueInputSchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(120),
  building: z.string().trim().min(1).max(120),
  floor: z.number().int().min(0).max(100).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  isUnderMaintenance: z.boolean().optional(),
});

export const UpdateVenueSchema = VenueInputSchema.partial().refine((input) => Object.keys(input).length > 0, {
  message: "Provide at least one venue field to update",
});