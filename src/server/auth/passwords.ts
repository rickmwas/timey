import { compare, hash } from "bcryptjs";
import { AppError } from "@/server/errors/app-error";

export const BCRYPT_COST = 12;

export function validatePassword(password: string, email?: string, institutionalId?: string): void {
  if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError("PASSWORD_POLICY", "Password must contain at least 10 characters, a letter, and a digit", 400);
  }
  const normalized = password.toLowerCase();
  if ((email && normalized === email.toLowerCase()) || (institutionalId && normalized === institutionalId.toLowerCase())) {
    throw new AppError("PASSWORD_POLICY", "Password must not match your email or institutional ID", 400);
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}