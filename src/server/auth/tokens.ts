import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/server/config/env";

const accessTokenLifetimeSeconds = 15 * 60;
const refreshTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const tokenSecret = new TextEncoder().encode(env.AUTH_SECRET);

export type AccessClaims = {
  userId: string;
  sessionId: string;
  role: string;
};

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ role: claims.role, sid: claims.sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${accessTokenLifetimeSeconds}s`)
    .sign(tokenSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, tokenSecret, { algorithms: ["HS256"] });
  if (typeof payload.sub !== "string" || typeof payload.sid !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid access token claims");
  }
  return { userId: payload.sub, sessionId: payload.sid, role: payload.role };
}

export function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiry(from = new Date()): Date {
  return new Date(from.getTime() + refreshTokenLifetimeMs);
}