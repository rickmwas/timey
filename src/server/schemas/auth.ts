import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(72),
});

export const RegisterStudentSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  institutionalId: z.string().trim().min(3).max(50),
  password: z.string().min(10).max(72),
  cohortId: z.string().uuid(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(10).max(72),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterStudentInput = z.infer<typeof RegisterStudentSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
