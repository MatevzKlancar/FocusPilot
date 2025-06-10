import type { Context } from "hono";
import { HTTP_STATUS } from "@focuspilot/types";

export async function errorHandler(err: Error, c: Context) {
  console.error("API Error:", {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method,
  });

  // Check for specific error types
  if (err.message.includes("JWT")) {
    return c.json(
      {
        error: "Authentication failed",
        message: "Invalid or expired token",
      },
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (err.message.includes("not found") || err.message.includes("No rows")) {
    return c.json(
      {
        error: "Resource not found",
        message: "The requested resource could not be found",
      },
      HTTP_STATUS.NOT_FOUND
    );
  }

  if (err.message.includes("validation") || err.message.includes("invalid")) {
    return c.json(
      {
        error: "Validation error",
        message: err.message,
      },
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (err.message.includes("permission") || err.message.includes("forbidden")) {
    return c.json(
      {
        error: "Permission denied",
        message: "You do not have permission to access this resource",
      },
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Default to internal server error
  return c.json(
    {
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "An unexpected error occurred",
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}
