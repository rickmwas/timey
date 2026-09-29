import { z } from "zod";

const dayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format");

export const AvailabilityQuerySchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  startTime: timeString,
  endTime: timeString,
  minCapacity: z.coerce.number().int().min(0).optional(),
  building: z.string().trim().min(1).optional(),
}).refine((data) => {
  const startMinutes = Number.parseInt(data.startTime.slice(0, 2), 10) * 60 + Number.parseInt(data.startTime.slice(3), 10);
  const endMinutes = Number.parseInt(data.endTime.slice(0, 2), 10) * 60 + Number.parseInt(data.endTime.slice(3), 10);
  return endMinutes > startMinutes;
}, {
  message: "endTime must be later than startTime",
  path: ["endTime"],
});

export const ValidateSlotSchema = z.object({
  id: z.string().uuid(),
  day: dayOfWeekEnum,
  startTime: timeString,
  endTime: timeString,
  venueId: z.string().uuid(),
  lecturerId: z.string().uuid(),
  offeringId: z.string().uuid(),
  cohortId: z.string().uuid(),
}).refine((data) => {
  const startMinutes = Number.parseInt(data.startTime.slice(0, 2), 10) * 60 + Number.parseInt(data.startTime.slice(3), 10);
  const endMinutes = Number.parseInt(data.endTime.slice(0, 2), 10) * 60 + Number.parseInt(data.endTime.slice(3), 10);
  return endMinutes > startMinutes;
}, {
  message: "endTime must be later than startTime",
  path: ["endTime"],
});
