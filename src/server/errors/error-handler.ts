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

  console.error("Unhandled API error", error instanceof Error ? error.name : "UnknownError");
  return failureResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
}