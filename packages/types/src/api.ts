import { z } from "zod";
import type { Goal, Task, Streak } from "./schemas.js";

// API Response wrapper
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Error types
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
});

// Specific API responses
export const GoalsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.any()), // Will be Goal[] at runtime
});

export const TasksResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.any()), // Will be Task[] at runtime
});

export const StreakResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(), // Will be Streak at runtime
});

// Query parameters
export const TasksQuerySchema = z.object({
  date: z.string().date().optional(),
  goal_id: z.string().uuid().optional(),
  completed: z.boolean().optional(),
});

// Type exports
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ApiError = z.infer<typeof ApiErrorSchema>;

export type GoalsResponse = ApiResponse<Goal[]>;
export type TasksResponse = ApiResponse<Task[]>;
export type StreakResponse = ApiResponse<Streak>;

export type TasksQuery = z.infer<typeof TasksQuerySchema>;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
