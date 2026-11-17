import { ImportStatus } from "@prisma/client";
import { z } from "zod";

export const ImportListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: z.nativeEnum(ImportStatus).optional(),
});

export const ImportVersionSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

export const ImportRowCorrectionSchema = z.object({
  expectedVersion: z.number().int().positive(),
  rawCourseCode: z.string().trim().max(120).nullable().optional(),
  rawCourseTitle: z.string().trim().max(200).nullable().optional(),
  rawVenue: z.string().trim().max(120).nullable().optional(),
  rawDay: z.string().trim().max(40).nullable().optional(),
  rawTime: z.string().trim().max(80).nullable().optional(),
  rawLecturer: z.string().trim().max(160).nullable().optional(),
  rawCohort: z.string().trim().max(160).nullable().optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "expectedVersion"), {
  message: "Provide at least one row field to correct",
});