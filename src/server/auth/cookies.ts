import type { NextResponse } from "next/server";
import type { SessionTokens } from "@/server/services/auth";

const accessLifetimeSeconds = 15 * 60;
const refreshLifetimeSeconds = 7 * 24 * 60 * 60;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookies(response: NextResponse, tokens: SessionTokens): void {
  response.cookies.set("timy_access", tokens.accessToken, { ...cookieOptions, maxAge: accessLifetimeSeconds });
  response.cookies.set("timy_refresh", tokens.refreshToken, { ...cookieOptions, maxAge: refreshLifetimeSeconds });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set("timy_access", "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set("timy_refresh", "", { ...cookieOptions, maxAge: 0 });
}