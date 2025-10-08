import type { Response } from "express";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "INTERNAL";

/** Uniform JSON error shape */
export function sendError(
  res: Response,
  status: number,
  message: string,
  code: ApiErrorCode = statusToCode(status),
  details?: unknown
) {
  return res.status(status).json({
    ok: false,
    error: { code, message, status, details },
  });
}

/** A couple of convenience wrappers */
export const badRequest = (res: Response, msg = "Bad request", details?: unknown) =>
  sendError(res, 400, msg, "BAD_REQUEST", details);
export const unauthorized = (res: Response, msg = "Unauthorized") =>
  sendError(res, 401, msg, "UNAUTHORIZED");
export const forbidden = (res: Response, msg = "Forbidden") =>
  sendError(res, 403, msg, "FORBIDDEN");
export const notFound = (res: Response, msg = "Not found") =>
  sendError(res, 404, msg, "NOT_FOUND");
export const conflict = (res: Response, msg = "Conflict") =>
  sendError(res, 409, msg, "CONFLICT");
export const unprocessable = (res: Response, msg = "Unprocessable") =>
  sendError(res, 422, msg, "UNPROCESSABLE");
export const internal = (res: Response, msg = "Internal server error", details?: unknown) =>
  sendError(res, 500, msg, "INTERNAL", details);

/** Map common HTTP status codes to default error codes */
function statusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHORIZED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 409: return "CONFLICT";
    case 422: return "UNPROCESSABLE";
    default:  return "INTERNAL";
  }
}
