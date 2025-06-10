import { z } from "zod";
import type {
  CreateGoalToolSchema,
  CreateTaskToolSchema,
  CompleteTaskToolSchema,
} from "@focuspilot/types";
import type { GoalsService, TasksService } from "@focuspilot/db";

// Tool parameter schemas
export const createGoalToolParams = z.object({
  title: z.string().min(1).max(255).describe("The title of the goal"),
  description: z
    .string()
    .optional()
    .describe("Optional description of the goal"),
  target_date: z
    .string()
    .date()
    .optional()
    .describe("Target completion date (YYYY-MM-DD)"),
});

export const createTaskToolParams = z.object({
  goal_id: z.string().uuid().describe("ID of the goal this task belongs to"),
  title: z.string().min(1).max(255).describe("The title of the task"),
  due_date: z
    .string()
    .date()
    .optional()
    .describe("Due date for the task (YYYY-MM-DD)"),
});

export const completeTaskToolParams = z.object({
  task_id: z.string().uuid().describe("ID of the task to mark as completed"),
});

export const getTodayTasksToolParams = z.object({});

// Tool definitions for OpenAI function calling (using JSON Schema format)
export const agentTools = [
  {
    type: "function" as const,
    function: {
      name: "create_goal",
      description:
        "Create a new goal for the user. Use this when the user expresses a desire to achieve something.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            description: "The title of the goal",
          },
          description: {
            type: "string",
            description: "Optional description of the goal",
          },
          target_date: {
            type: "string",
            format: "date",
            description: "Target completion date (YYYY-MM-DD)",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description:
        "Create a specific task to help achieve a goal. Break down goals into actionable tasks.",
      parameters: {
        type: "object",
        properties: {
          goal_id: {
            type: "string",
            format: "uuid",
            description: "ID of the goal this task belongs to",
          },
          title: {
            type: "string",
            minLength: 1,
            maxLength: 255,
            description: "The title of the task",
          },
          due_date: {
            type: "string",
            format: "date",
            description: "Due date for the task (YYYY-MM-DD)",
          },
        },
        required: ["goal_id", "title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "complete_task",
      description:
        "Mark a task as completed. This will update the user's streak automatically.",
      parameters: {
        type: "object",
        properties: {
          task_id: {
            type: "string",
            format: "uuid",
            description: "ID of the task to mark as completed",
          },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_today_tasks",
      description:
        "Get all tasks due today for the user. Use this to provide context about current focus.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

// Tool execution functions
export interface ToolContext {
  userId: string;
  goalsService: GoalsService;
  tasksService: TasksService;
}

export async function executeCreateGoal(
  params: z.infer<typeof createGoalToolParams>,
  context: ToolContext
) {
  const goal = await context.goalsService.create({
    user_id: context.userId,
    title: params.title,
    description: params.description,
    target_date: params.target_date,
  });

  return {
    success: true,
    data: goal,
    message: `Created goal: "${goal.title}"`,
  };
}

export async function executeCreateTask(
  params: z.infer<typeof createTaskToolParams>,
  context: ToolContext
) {
  const task = await context.tasksService.create({
    goal_id: params.goal_id,
    user_id: context.userId,
    title: params.title,
    due_date: params.due_date,
  });

  return {
    success: true,
    data: task,
    message: `Created task: "${task.title}"`,
  };
}

export async function executeCompleteTask(
  params: z.infer<typeof completeTaskToolParams>,
  context: ToolContext
) {
  const task = await context.tasksService.complete(
    params.task_id,
    context.userId
  );

  return {
    success: true,
    data: task,
    message: `Completed task: "${task.title}" 🎉`,
  };
}

export async function executeGetTodayTasks(
  params: z.infer<typeof getTodayTasksToolParams>,
  context: ToolContext
) {
  const tasks = await context.tasksService.getTodayTasks(context.userId);

  return {
    success: true,
    data: tasks,
    message: `Found ${tasks.length} tasks for today`,
  };
}

// Tool execution dispatcher
export async function executeTool(
  toolName: string,
  params: any,
  context: ToolContext
) {
  switch (toolName) {
    case "create_goal":
      return executeCreateGoal(createGoalToolParams.parse(params), context);

    case "create_task":
      return executeCreateTask(createTaskToolParams.parse(params), context);

    case "complete_task":
      return executeCompleteTask(completeTaskToolParams.parse(params), context);

    case "get_today_tasks":
      return executeGetTodayTasks(
        getTodayTasksToolParams.parse(params),
        context
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
