import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Date must be a valid YYYY-MM-DD value");

const baseShape = {
  occurrenceDate: isoDate,
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1000),
};

const timeShape = {
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  venueId: z.string().uuid().optional(),
};

function addTimePairIssue(value: { startTime?: string; endTime?: string }, context: z.RefinementCtx) {
  if (Boolean(value.startTime) !== Boolean(value.endTime)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "startTime and endTime must be supplied together" });
  }
}

export const RescheduleSchema = z.object({
  ...baseShape,
  replacementDate: isoDate.optional(),
  ...timeShape,
}).superRefine((value, context) => {
  addTimePairIssue(value, context);
  if (!value.replacementDate && !value.startTime && !value.venueId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Provide a replacement date, time, or venue" });
  }
});

export const CancelScheduleSchema = z.object(baseShape);

export const PostponeSchema = z.object({
  ...baseShape,
  replacementDate: isoDate,
  ...timeShape,
}).superRefine(addTimePairIssue);

export type RescheduleInput = z.infer<typeof RescheduleSchema>;
export type CancelScheduleInput = z.infer<typeof CancelScheduleSchema>;
export type PostponeInput = z.infer<typeof PostponeSchema>;