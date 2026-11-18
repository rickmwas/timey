import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function successResponse<T>(
  data: T,
  status = 200,
  message?: string,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status },
  );
}

export function failureResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details === undefined ? {} : { details }) },
    },
    { status },
  );
}