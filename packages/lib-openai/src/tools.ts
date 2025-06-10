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

export const createGoalWithBreakdownToolParams = z.object({
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
  daily_time_minutes: z
    .number()
    .min(15)
    .max(480)
    .describe("How many minutes per day the user will dedicate to this goal"),
  goal_type: z
    .enum([
      "skill_learning",
      "creative_project",
      "fitness",
      "habit_building",
      "career",
      "personal_development",
    ])
    .describe("Type of goal to determine appropriate task breakdown strategy"),
});

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
  {
    type: "function" as const,
    function: {
      name: "create_goal_with_breakdown",
      description:
        "Create a goal and automatically break it down into time-based daily/weekly tasks. Use this when user wants to achieve something but needs a structured plan.",
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
          daily_time_minutes: {
            type: "number",
            minimum: 15,
            maximum: 480,
            description:
              "How many minutes per day the user will dedicate to this goal",
          },
          goal_type: {
            type: "string",
            enum: [
              "skill_learning",
              "creative_project",
              "fitness",
              "habit_building",
              "career",
              "personal_development",
            ],
            description:
              "Type of goal to determine appropriate task breakdown strategy",
          },
        },
        required: ["title", "daily_time_minutes", "goal_type"],
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

  if (tasks.length === 0) {
    return {
      success: true,
      data: tasks,
      message:
        "No tasks scheduled for today. Time to create some or you're just wasting time.",
    };
  }

  // Format tasks for hardcore messaging
  const taskList = tasks
    .map((task, index) => {
      const status = task.completed_at ? "✅ DONE" : "❌ PENDING";
      const recurringNote = task.is_recurring ? ` (${task.cadence})` : "";
      return `${index + 1}. ${status} - ${task.title}${recurringNote}${
        task.description ? `\n   ${task.description}` : ""
      }`;
    })
    .join("\n\n");

  const pendingCount = tasks.filter((t) => !t.completed_at).length;
  const completedCount = tasks.filter((t) => t.completed_at).length;

  const message =
    pendingCount > 0
      ? `You have ${pendingCount} task${
          pendingCount !== 1 ? "s" : ""
        } left today. Stop making excuses and get to work:\n\n${taskList}\n\nNo more scrolling. No more "I'll do it later." START NOW.`
      : `All ${completedCount} tasks completed today. Good. Don't get comfortable - tomorrow is another test:\n\n${taskList}`;

  return {
    success: true,
    data: tasks,
    message,
  };
}

export async function executeCreateGoalWithBreakdown(
  params: z.infer<typeof createGoalWithBreakdownToolParams>,
  context: ToolContext
) {
  // Create the main goal first
  const goal = await context.goalsService.create({
    user_id: context.userId,
    title: params.title,
    description: params.description,
    target_date: params.target_date,
  });

  // Generate time-based task breakdown
  const taskBreakdown = generateTaskBreakdown(
    params.goal_type,
    params.daily_time_minutes,
    params.title
  );

  // Create all the tasks
  const createdTasks = [];
  const today = new Date();

  for (const taskTemplate of taskBreakdown) {
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + taskTemplate.daysFromStart);

    const task = await context.tasksService.create({
      goal_id: goal.id,
      user_id: context.userId,
      title: taskTemplate.title,
      description: taskTemplate.description,
      due_date: dueDate.toISOString().split("T")[0],
      is_recurring: taskTemplate.isRecurring,
      cadence: "cadence" in taskTemplate ? taskTemplate.cadence : undefined,
    });

    createdTasks.push(task);
  }

  return {
    success: true,
    data: { goal, tasks: createdTasks },
    message: `Goal created with ${createdTasks.length} time-based tasks. No excuses now - you have exactly ${params.daily_time_minutes} minutes per day to make progress. Time to prove you're serious.`,
  };
}

function generateTaskBreakdown(
  goalType: string,
  dailyMinutes: number,
  goalTitle: string
) {
  const baseDaily = {
    isRecurring: true,
    cadence: "daily" as const,
    daysFromStart: 0,
  };

  const baseWeekly = {
    isRecurring: true,
    cadence: "weekly" as const,
    daysFromStart: 0,
  };

  switch (goalType) {
    case "skill_learning":
      return [
        {
          ...baseDaily,
          title: `Practice ${goalTitle.toLowerCase()} - ${dailyMinutes} minutes`,
          description: `Daily focused practice session. No phone, no distractions. ${dailyMinutes} minutes of pure work.`,
        },
        {
          ...baseWeekly,
          title: `Weekly ${goalTitle.toLowerCase()} assessment`,
          description:
            "Test your progress. What did you actually learn? What are you still struggling with?",
        },
        {
          isRecurring: false,
          daysFromStart: 3,
          title: "Research learning resources and create study plan",
          description:
            "Stop wandering aimlessly. Find the best resources and create a structured learning path.",
        },
        {
          isRecurring: false,
          daysFromStart: 7,
          title: "Complete first major milestone",
          description:
            "Prove you're not just going through the motions. Demonstrate real progress.",
        },
      ];

    case "creative_project":
      return [
        {
          ...baseDaily,
          title: `Work on ${goalTitle.toLowerCase()} - ${dailyMinutes} minutes`,
          description: `Daily creation time. Show up even when you don't feel inspired. Inspiration is for amateurs.`,
        },
        {
          ...baseWeekly,
          title: `Review and plan next phase of ${goalTitle.toLowerCase()}`,
          description:
            "Assess what you've created. What sucks? What's good? Plan the next phase.",
        },
        {
          isRecurring: false,
          daysFromStart: 1,
          title: "Create detailed project outline",
          description:
            "Stop making it up as you go. Create a roadmap so you know what you're building.",
        },
        {
          isRecurring: false,
          daysFromStart: 14,
          title: "Complete first major deliverable",
          description:
            "Time to produce something real. Not perfect, but real and measurable.",
        },
      ];

    case "fitness":
      return [
        {
          ...baseDaily,
          title: `Workout - ${dailyMinutes} minutes`,
          description: `Daily physical training. No 'rest days' - active recovery counts. Your body adapts to what you demand.`,
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Record baseline fitness metrics",
          description:
            "Measure where you're starting. Weight, strength, endurance. Numbers don't lie.",
        },
        {
          isRecurring: false,
          daysFromStart: 7,
          title: "Increase workout intensity",
          description:
            "Time to level up. Same workout = same results. Push harder.",
        },
        {
          isRecurring: false,
          daysFromStart: 30,
          title: "Complete fitness assessment",
          description:
            "Prove your progress with measurable results. How much stronger/faster are you?",
        },
      ];

    case "habit_building":
      return [
        {
          ...baseDaily,
          title: `${goalTitle} - ${dailyMinutes} minutes`,
          description: `Daily habit execution. Consistency beats intensity. Miss a day and you're back to square one.`,
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Set up environment for success",
          description:
            "Remove friction and excuses. Set up your environment so the habit is easier than not doing it.",
        },
        {
          isRecurring: false,
          daysFromStart: 21,
          title: "Habit strength check",
          description:
            "21 days in. Is this feeling automatic yet? If not, you're not doing it right.",
        },
        {
          isRecurring: false,
          daysFromStart: 66,
          title: "Habit mastery milestone",
          description:
            "66 days of consistency. This should be automatic now. Time to level up or add complexity.",
        },
      ];

    case "career":
      return [
        {
          ...baseDaily,
          title: `Career development - ${dailyMinutes} minutes`,
          description: `Daily career investment. Network, learn, apply, create. Your future self will thank you.`,
        },
        {
          ...baseWeekly,
          title: "Weekly career progress review",
          description:
            "What concrete progress did you make this week? Feelings don't count, actions do.",
        },
        {
          isRecurring: false,
          daysFromStart: 1,
          title: "Create career action plan",
          description:
            "Stop hoping things will work out. Create a specific plan with deadlines.",
        },
        {
          isRecurring: false,
          daysFromStart: 30,
          title: "Complete major career milestone",
          description:
            "One month in. Time to have something real to show for your efforts.",
        },
      ];

    case "personal_development":
      return [
        {
          ...baseDaily,
          title: `Personal development - ${dailyMinutes} minutes`,
          description: `Daily growth work. Read, reflect, practice. Small daily improvements compound into massive change.`,
        },
        {
          ...baseWeekly,
          title: "Weekly self-assessment",
          description:
            "How are you different than last week? What limiting beliefs did you challenge?",
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Identify core areas for improvement",
          description:
            "Stop being vague. What specifically needs to change about you?",
        },
        {
          isRecurring: false,
          daysFromStart: 14,
          title: "Implement one significant change",
          description:
            "Two weeks of thinking. Time to make a real change in how you operate.",
        },
      ];

    default:
      return [
        {
          ...baseDaily,
          title: `Work on ${goalTitle.toLowerCase()} - ${dailyMinutes} minutes`,
          description: `Daily progress on your goal. Show up consistently. Excellence is a habit.`,
        },
      ];
  }
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

    case "create_goal_with_breakdown":
      return executeCreateGoalWithBreakdown(
        createGoalWithBreakdownToolParams.parse(params),
        context
      );

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
