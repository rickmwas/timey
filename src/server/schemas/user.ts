import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";

const optionalUuid = z.string().uuid().nullable().optional();

export const CreateUserSchema = z.object({
  email: z.string().trim().email().max(254),
  institutionalId: z.string().trim().min(2).max(64),
  fullName: z.string().trim().min(2).max(160),
  role: z.nativeEnum(Role),
  cohortId: optionalUuid,
  departmentId: optionalUuid,
});

export const UpdateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  institutionalId: z.string().trim().min(2).max(64).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  cohortId: optionalUuid,
  departmentId: optionalUuid,
}).refine((data) => Object.keys(data).length > 0, "At least one field is required");

export const UserListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});