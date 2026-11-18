import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Date must be a valid YYYY-MM-DD value");

export const TimetableReadQuerySchema = z.object({
  startDate: isoDate,
  endDate: isoDate,
  periodId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  lecturerId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).refine((value) => value.startDate <= value.endDate, {
  message: "endDate must be on or after startDate",
  path: ["endDate"],
});

export type TimetableReadQuery = z.infer<typeof TimetableReadQuerySchema>;