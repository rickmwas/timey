import { AnnouncementPriority } from "@prisma/client";
import { z } from "zod";

const optionalUuid = z.string().uuid().nullable().optional();
const expiry = z.string().datetime({ offset: true }).nullable().optional();

export const AnnouncementListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cohortId: z.string().uuid().optional(),
  offeringId: z.string().uuid().optional(),
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(1).max(10000),
  cohortId: optionalUuid,
  offeringId: optionalUuid,
  priority: z.nativeEnum(AnnouncementPriority).default(AnnouncementPriority.NORMAL),
  expiresAt: expiry,
}).refine((value) => Boolean(value.cohortId) !== Boolean(value.offeringId), {
  message: "Select exactly one cohort or course offering audience",
  path: ["cohortId"],
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  content: z.string().trim().min(1).max(10000).optional(),
  cohortId: optionalUuid,
  offeringId: optionalUuid,
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  expiresAt: expiry,
}).refine((value) => Object.keys(value).length > 0, "Provide at least one announcement field to update")
  .refine((value) => value.cohortId === undefined && value.offeringId === undefined || Boolean(value.cohortId) !== Boolean(value.offeringId), {
    message: "Select exactly one cohort or course offering audience",
    path: ["cohortId"],
  });