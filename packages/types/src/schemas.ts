import { z } from "zod";

// Base schemas
export const UUIDSchema = z.string().uuid();
export const DateSchema = z.string().datetime().or(z.date());

// Goal schemas
export const GoalSchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  target_date: z.string().date().optional(),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  target_date: z.string().date().optional(),
});

export const UpdateGoalSchema = CreateGoalSchema.partial();

// Task schemas
export const TaskCadenceSchema = z.enum(["daily", "weekly", "monthly"]);

export const TaskSchema = z.object({
  id: UUIDSchema,
  goal_id: UUIDSchema,
  user_id: UUIDSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  due_date: z.string().date().optional(),
  is_recurring: z.boolean().default(false),
  cadence: TaskCadenceSchema.optional(),
  completed_at: DateSchema.optional(),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const CreateTaskSchema = z.object({
  goal_id: UUIDSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  due_date: z.string().date().optional(),
  is_recurring: z.boolean().default(false),
  cadence: TaskCadenceSchema.optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().omit({
  goal_id: true,
});

export const CompleteTaskSchema = z.object({
  completed_at: DateSchema.optional(),
});

// Streak schemas
export const StreakSchema = z.object({
  user_id: UUIDSchema,
  current_streak: z.number().int().min(0),
  best_streak: z.number().int().min(0),
  last_activity: z.string().date().optional(),
  created_at: DateSchema,
  updated_at: DateSchema,
});

// Chat schemas
export const ChatSessionSchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  title: z.string().optional(),
  last_message_at: DateSchema,
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const ChatMessageSchema = z.object({
  id: UUIDSchema,
  session_id: UUIDSchema,
  user_id: UUIDSchema,
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  created_at: DateSchema,
  updated_at: DateSchema,
});

export const CreateChatSessionSchema = z.object({
  title: z.string().optional(),
});

export const CreateChatMessageSchema = z.object({
  session_id: UUIDSchema,
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  session_id: UUIDSchema.optional(),
});

// Agent tool schemas
export const CreateGoalToolSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  target_date: z.string().date().optional(),
});

export const CreateTaskToolSchema = z.object({
  goal_id: UUIDSchema,
  title: z.string().min(1).max(255),
  due_date: z.string().date().optional(),
});

export const CompleteTaskToolSchema = z.object({
  task_id: UUIDSchema,
});

// Type exports
export type Goal = z.infer<typeof GoalSchema>;
export type CreateGoal = z.infer<typeof CreateGoalSchema>;
export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;

export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
export type CompleteTask = z.infer<typeof CompleteTaskSchema>;
export type TaskCadence = z.infer<typeof TaskCadenceSchema>;

export type Streak = z.infer<typeof StreakSchema>;

export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type CreateChatSession = z.infer<typeof CreateChatSessionSchema>;
export type CreateChatMessage = z.infer<typeof CreateChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export type CreateGoalTool = z.infer<typeof CreateGoalToolSchema>;
export type CreateTaskTool = z.infer<typeof CreateTaskToolSchema>;
export type CompleteTaskTool = z.infer<typeof CompleteTaskToolSchema>;
