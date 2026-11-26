import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/server/errors/app-error";
import { failureResponse } from "@/server/http/responses";

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return failureResponse(error.code, error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    return failureResponse("VALIDATION_ERROR", "Request validation failed", 400, error.flatten());
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return failureResponse("DUPLICATE_RESOURCE", "A resource with these values already exists", 409);
    }
    if (error.code === "P2025") {
      return failureResponse("NOT_FOUND", "Resource not found", 404);
    }
    if (error.code === "P2034") {
      return failureResponse("CONCURRENT_UPDATE", "The resource changed concurrently", 409);
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[Database Connection Error]:", error.message);
    return failureResponse(
      "DATABASE_CONNECTION_ERROR",
      process.env.NODE_ENV === "development"
        ? `Database connection failed: ${error.message}`
        : "Could not connect to database server. Verify DATABASE_URL in Vercel environment variables.",
      500,
    );
  }

  console.error("Unhandled API error:", error);
  return failureResponse(
    "INTERNAL_ERROR",
    process.env.NODE_ENV === "development" && error instanceof Error ? error.message : "An unexpected error occurred",
    500,
  );
}