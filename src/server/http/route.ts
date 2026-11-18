import type { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/errors/error-handler";

export type RouteContext = { params: Record<string, string> };
type RouteFunction = (request: NextRequest, context?: RouteContext) => Promise<NextResponse>;

export function apiHandler(handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>): RouteFunction {
  return async (request, context = { params: {} }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
