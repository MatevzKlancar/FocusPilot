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
      "mvp_launch",
      "customer_acquisition",
      "revenue_generation",
      "product_validation",
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
              "mvp_launch",
              "customer_acquisition",
              "revenue_generation",
              "product_validation",
            ],
            description:
              "Type of goal to determine appropriate task breakdown strategy",
          },
        },
        required: ["title", "daily_time_minutes", "goal_type"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_entrepreneur_metrics",
      description:
        "Get key entrepreneurial metrics to call out progress or lack thereof in customer conversations, revenue, and shipping",
      parameters: {
        type: "object",
        properties: {},
        required: [],
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

  // Get user context for AI response generation
  const [allGoals, allTasks] = await Promise.all([
    context.goalsService.getAll(context.userId),
    context.tasksService.getAll(context.userId),
  ]);

  return {
    success: true,
    action: "goal_created",
    data: {
      goal,
      user_context: {
        total_goals: allGoals.length,
        total_tasks: allTasks.length,
        completed_tasks: allTasks.filter((t) => t.completed_at).length,
        is_first_goal: allGoals.length === 1,
      },
    },
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

  // Get goal context for AI response
  const [goal, allTasks] = await Promise.all([
    context.goalsService.getById(params.goal_id, context.userId),
    context.tasksService.getAll(context.userId),
  ]);

  const goalTasks = allTasks.filter((t) => t.goal_id === params.goal_id);

  return {
    success: true,
    action: "task_created",
    data: {
      task,
      goal,
      user_context: {
        total_tasks_for_goal: goalTasks.length,
        is_first_task_for_goal: goalTasks.length === 1,
        pending_tasks_today: allTasks.filter(
          (t) =>
            t.due_date === new Date().toISOString().split("T")[0] &&
            !t.completed_at
        ).length,
      },
    },
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

  // Get comprehensive context for AI response generation
  const [allTasks, goals] = await Promise.all([
    context.tasksService.getAll(context.userId),
    context.goalsService.getAll(context.userId),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = allTasks.filter((t) => t.due_date === today);
  const todayCompleted = todayTasks.filter((t) => t.completed_at);
  const todayPending = todayTasks.filter((t) => !t.completed_at);

  // Calculate streak info
  const recentTasks = allTasks
    .filter((t) => t.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() -
        new Date(a.completed_at!).getTime()
    );

  // Analyze task type for entrepreneur insights
  const isCustomerTask =
    task.title.toLowerCase().includes("customer") ||
    task.title.toLowerCase().includes("user") ||
    task.title.toLowerCase().includes("feedback") ||
    task.title.toLowerCase().includes("interview");

  const isRevenueTask =
    task.title.toLowerCase().includes("revenue") ||
    task.title.toLowerCase().includes("sale") ||
    task.title.toLowerCase().includes("pricing") ||
    task.title.toLowerCase().includes("money");

  const isShippingTask =
    task.title.toLowerCase().includes("ship") ||
    task.title.toLowerCase().includes("launch") ||
    task.title.toLowerCase().includes("deploy") ||
    task.title.toLowerCase().includes("mvp");

  return {
    success: true,
    action: "task_completed",
    data: {
      task,
      user_context: {
        today_progress: {
          completed: todayCompleted.length,
          pending: todayPending.length,
          total: todayTasks.length,
          completion_rate:
            todayTasks.length > 0
              ? Math.round((todayCompleted.length / todayTasks.length) * 100)
              : 0,
        },
        task_analysis: {
          is_customer_related: isCustomerTask,
          is_revenue_related: isRevenueTask,
          is_shipping_related: isShippingTask,
          task_difficulty:
            (task.description?.length || 0) > 100 ? "complex" : "simple",
        },
        recent_performance: {
          tasks_completed_last_7_days: recentTasks.filter((t) => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(t.completed_at!) > weekAgo;
          }).length,
          last_completion_date: recentTasks[0]?.completed_at,
        },
        business_context: {
          total_goals: goals.length,
          entrepreneur_goals: goals.filter(
            (g) =>
              g.title.toLowerCase().includes("mvp") ||
              g.title.toLowerCase().includes("customer") ||
              g.title.toLowerCase().includes("revenue")
          ).length,
        },
      },
    },
  };
}

export async function executeGetTodayTasks(
  params: z.infer<typeof getTodayTasksToolParams>,
  context: ToolContext
) {
  const tasks = await context.tasksService.getTodayTasks(context.userId);

  // Get comprehensive context for AI to generate appropriate response
  const [allTasks, goals] = await Promise.all([
    context.tasksService.getAll(context.userId),
    context.goalsService.getAll(context.userId),
  ]);

  const pendingCount = tasks.filter((t) => !t.completed_at).length;
  const completedCount = tasks.filter((t) => t.completed_at).length;

  // Analyze task types for entrepreneur insights
  const customerTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes("customer") ||
      t.title.toLowerCase().includes("user") ||
      t.title.toLowerCase().includes("feedback")
  );

  const revenueTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes("revenue") ||
      t.title.toLowerCase().includes("sale") ||
      t.title.toLowerCase().includes("pricing")
  );

  const shippingTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes("ship") ||
      t.title.toLowerCase().includes("launch") ||
      t.title.toLowerCase().includes("deploy")
  );

  return {
    success: true,
    action: "today_tasks_retrieved",
    data: {
      tasks,
      user_context: {
        task_summary: {
          total: tasks.length,
          completed: completedCount,
          pending: pendingCount,
          completion_rate:
            tasks.length > 0
              ? Math.round((completedCount / tasks.length) * 100)
              : 0,
        },
        task_analysis: {
          customer_tasks: {
            total: customerTasks.length,
            pending: customerTasks.filter((t) => !t.completed_at).length,
          },
          revenue_tasks: {
            total: revenueTasks.length,
            pending: revenueTasks.filter((t) => !t.completed_at).length,
          },
          shipping_tasks: {
            total: shippingTasks.length,
            pending: shippingTasks.filter((t) => !t.completed_at).length,
          },
        },
        performance_context: {
          total_goals: goals.length,
          total_tasks_all_time: allTasks.length,
          completed_tasks_all_time: allTasks.filter((t) => t.completed_at)
            .length,
          has_no_tasks: tasks.length === 0,
          all_tasks_done: tasks.length > 0 && pendingCount === 0,
        },
      },
    },
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

  // Get user context for AI response
  const [allGoals, allTasks] = await Promise.all([
    context.goalsService.getAll(context.userId),
    context.tasksService.getAll(context.userId),
  ]);

  const isEntrepreneurGoal = [
    "mvp_launch",
    "customer_acquisition",
    "revenue_generation",
    "product_validation",
  ].includes(params.goal_type);

  const dailyTasks = createdTasks.filter((t) =>
    taskBreakdown.some(
      (tb) =>
        tb.title === t.title &&
        tb.isRecurring &&
        "cadence" in tb &&
        tb.cadence === "daily"
    )
  );
  const weeklyTasks = createdTasks.filter((t) =>
    taskBreakdown.some(
      (tb) =>
        tb.title === t.title &&
        tb.isRecurring &&
        "cadence" in tb &&
        tb.cadence === "weekly"
    )
  );
  const milestoneTasks = createdTasks.filter((t) =>
    taskBreakdown.some((tb) => tb.title === t.title && !tb.isRecurring)
  );

  return {
    success: true,
    action: "goal_with_breakdown_created",
    data: {
      goal,
      tasks: createdTasks,
      user_context: {
        goal_analysis: {
          type: params.goal_type,
          is_entrepreneur_goal: isEntrepreneurGoal,
          daily_commitment_minutes: params.daily_time_minutes,
          total_goals: allGoals.length,
          is_first_goal: allGoals.length === 1,
        },
        task_breakdown: {
          total_tasks_created: createdTasks.length,
          daily_tasks: dailyTasks.length,
          weekly_tasks: weeklyTasks.length,
          milestone_tasks: milestoneTasks.length,
        },
        business_context: {
          entrepreneur_goals_count: allGoals.filter(
            (g) =>
              g.title.toLowerCase().includes("mvp") ||
              g.title.toLowerCase().includes("customer") ||
              g.title.toLowerCase().includes("revenue")
          ).length,
          total_tasks_all_time: allTasks.length + createdTasks.length,
        },
      },
    },
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

    case "mvp_launch":
      return [
        {
          ...baseDaily,
          title: `Build MVP - ${dailyMinutes} minutes`,
          description: `Daily development work. Ship ugly, get feedback, iterate. Perfect is the enemy of shipped.`,
        },
        {
          ...baseDaily,
          title: "Talk to 1 potential customer - 15 minutes",
          description:
            "Daily customer validation. Ask about their pain points, not your solution. Stop building in the dark.",
        },
        {
          ...baseWeekly,
          title: "Ship something to users",
          description:
            "Weekly shipment deadline. Feature, bug fix, improvement - doesn't matter. Show progress or shut down.",
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Define MVP scope - maximum 3 core features",
          description:
            "Stop dreaming about the full product. What's the minimum that solves ONE real problem?",
        },
        {
          isRecurring: false,
          daysFromStart: 3,
          title: "Set up analytics and feedback collection",
          description:
            "How will you know if anyone actually uses this? Set up tracking before you ship.",
        },
        {
          isRecurring: false,
          daysFromStart: 14,
          title: "Launch to first 10 users",
          description:
            "Two weeks is enough. Launch your ugly MVP to real users and start learning.",
        },
      ];

    case "customer_acquisition":
      return [
        {
          ...baseDaily,
          title: `Customer outreach - ${dailyMinutes} minutes`,
          description: `Daily customer acquisition work. Cold emails, social media, networking. No customers = no business.`,
        },
        {
          ...baseDaily,
          title: "Have 1 customer conversation - 20 minutes",
          description:
            "Daily customer contact. Sales calls, feedback sessions, user interviews. Stay connected to reality.",
        },
        {
          ...baseWeekly,
          title: "Analyze acquisition metrics",
          description:
            "Weekly metric review. Conversion rates, cost per acquisition, retention. What's working? What's not?",
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Identify primary customer acquisition channel",
          description:
            "Stop trying everything. Pick ONE channel and dominate it before expanding.",
        },
        {
          isRecurring: false,
          daysFromStart: 7,
          title: "Create customer acquisition system",
          description:
            "Build repeatable process for finding and converting customers. Systems beat hustle.",
        },
        {
          isRecurring: false,
          daysFromStart: 30,
          title: "Achieve first 100 customers milestone",
          description:
            "One month to prove you can acquire customers consistently. Scale or pivot.",
        },
      ];

    case "revenue_generation":
      return [
        {
          ...baseDaily,
          title: `Revenue activities - ${dailyMinutes} minutes`,
          description: `Daily revenue-focused work. Sales, pricing optimization, upselling. Revenue is oxygen.`,
        },
        {
          ...baseDaily,
          title: "Close 1 sale or improve pricing - 30 minutes",
          description:
            "Daily revenue push. Send proposals, follow up on leads, test price points. Money talks.",
        },
        {
          ...baseWeekly,
          title: "Revenue and metrics review",
          description:
            "Weekly financial reality check. MRR, churn, ARPU, runway. Are you growing or dying?",
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Set up revenue tracking and goals",
          description:
            "Define your revenue targets and tracking system. What gets measured gets managed.",
        },
        {
          isRecurring: false,
          daysFromStart: 3,
          title: "Optimize pricing strategy",
          description:
            "Test different price points. Most founders underprice. Find what customers will actually pay.",
        },
        {
          isRecurring: false,
          daysFromStart: 14,
          title: "Achieve first $1000 in revenue",
          description:
            "Two weeks to prove people will pay. If not, question your entire approach.",
        },
      ];

    case "product_validation":
      return [
        {
          ...baseDaily,
          title: `Product validation - ${dailyMinutes} minutes`,
          description: `Daily validation work. User interviews, surveys, analytics review. Build what people want.`,
        },
        {
          ...baseDaily,
          title: "Collect user feedback - 20 minutes",
          description:
            "Daily feedback collection. In-app surveys, user interviews, support tickets. Listen obsessively.",
        },
        {
          ...baseWeekly,
          title: "Analyze product usage data",
          description:
            "Weekly data review. What features are used? What's ignored? Let data guide decisions.",
        },
        {
          isRecurring: false,
          daysFromStart: 0,
          title: "Define validation hypotheses",
          description:
            "What do you think users want? Write it down. Then go prove or disprove it.",
        },
        {
          isRecurring: false,
          daysFromStart: 5,
          title: "Set up user analytics and heatmaps",
          description:
            "Install tracking to see how users actually behave. Assumptions are dangerous.",
        },
        {
          isRecurring: false,
          daysFromStart: 21,
          title: "Product-market fit assessment",
          description:
            "Three weeks of data. Do users love this? Are they paying? Pivot or double down.",
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

export async function executeGetEntrepreneurMetrics(
  params: any,
  context: ToolContext
) {
  const [goals, allTasks] = await Promise.all([
    context.goalsService.getAll(context.userId),
    context.tasksService.getAll(context.userId),
  ]);

  // Analyze task patterns for entrepreneur-specific insights
  const today = new Date().toISOString().split("T")[0];
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const customerTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes("customer") ||
      task.title.toLowerCase().includes("user") ||
      task.title.toLowerCase().includes("feedback") ||
      task.title.toLowerCase().includes("interview") ||
      task.title.toLowerCase().includes("talk to")
  );

  const revenueTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes("revenue") ||
      task.title.toLowerCase().includes("sale") ||
      task.title.toLowerCase().includes("pricing") ||
      task.title.toLowerCase().includes("money") ||
      task.title.toLowerCase().includes("outreach") ||
      task.title.toLowerCase().includes("close")
  );

  const shippingTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes("ship") ||
      task.title.toLowerCase().includes("launch") ||
      task.title.toLowerCase().includes("deploy") ||
      task.title.toLowerCase().includes("mvp") ||
      task.title.toLowerCase().includes("build") ||
      task.title.toLowerCase().includes("feature")
  );

  const completedCustomerTasks = customerTasks.filter(
    (task) => task.completed_at
  );
  const completedRevenueTasks = revenueTasks.filter(
    (task) => task.completed_at
  );
  const completedShippingTasks = shippingTasks.filter(
    (task) => task.completed_at
  );

  const recentCustomerTasks = customerTasks.filter(
    (task) => task.due_date && task.due_date >= last7Days && task.completed_at
  );

  const entrepreneurGoals = goals.filter((goal) =>
    [
      "mvp_launch",
      "customer_acquisition",
      "revenue_generation",
      "product_validation",
    ].some(
      (type) =>
        goal.title.toLowerCase().includes(type.replace("_", " ")) ||
        goal.description?.toLowerCase().includes(type.replace("_", " "))
    )
  );

  const lastCustomerTaskDate = customerTasks
    .filter((task) => task.completed_at)
    .sort(
      (a, b) =>
        new Date(b.completed_at!).getTime() -
        new Date(a.completed_at!).getTime()
    )[0];

  const daysSinceLastCustomerTask = lastCustomerTaskDate
    ? Math.floor(
        (Date.now() - new Date(lastCustomerTaskDate.completed_at!).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  const metrics = {
    total_goals: goals.length,
    entrepreneur_goals: entrepreneurGoals.length,
    customer_tasks_total: customerTasks.length,
    customer_tasks_completed: completedCustomerTasks.length,
    customer_conversations_last_7_days: recentCustomerTasks.length,
    revenue_tasks_total: revenueTasks.length,
    revenue_tasks_completed: completedRevenueTasks.length,
    shipping_tasks_total: shippingTasks.length,
    shipping_tasks_completed: completedShippingTasks.length,
    days_since_last_customer_task: daysSinceLastCustomerTask,
    customer_completion_rate:
      customerTasks.length > 0
        ? Math.round(
            (completedCustomerTasks.length / customerTasks.length) * 100
          )
        : 0,
    revenue_completion_rate:
      revenueTasks.length > 0
        ? Math.round((completedRevenueTasks.length / revenueTasks.length) * 100)
        : 0,
    shipping_completion_rate:
      shippingTasks.length > 0
        ? Math.round(
            (completedShippingTasks.length / shippingTasks.length) * 100
          )
        : 0,
  };

  return {
    success: true,
    action: "entrepreneur_metrics_analyzed",
    data: {
      metrics,
      user_context: {
        business_health: {
          has_entrepreneur_goals: metrics.entrepreneur_goals > 0,
          customer_contact_frequency:
            metrics.days_since_last_customer_task <= 3
              ? "good"
              : metrics.days_since_last_customer_task <= 7
              ? "warning"
              : "critical",
          revenue_focus:
            metrics.revenue_completion_rate >= 50 ? "strong" : "weak",
          shipping_velocity:
            metrics.shipping_completion_rate >= 70 ? "strong" : "weak",
          recent_customer_activity: metrics.customer_conversations_last_7_days,
        },
        performance_summary: {
          total_tasks_tracked:
            customerTasks.length + revenueTasks.length + shippingTasks.length,
          overall_execution_rate: Math.round(
            ((completedCustomerTasks.length +
              completedRevenueTasks.length +
              completedShippingTasks.length) /
              Math.max(
                1,
                customerTasks.length +
                  revenueTasks.length +
                  shippingTasks.length
              )) *
              100
          ),
          strongest_area:
            metrics.customer_completion_rate >=
              metrics.revenue_completion_rate &&
            metrics.customer_completion_rate >= metrics.shipping_completion_rate
              ? "customer"
              : metrics.revenue_completion_rate >=
                metrics.shipping_completion_rate
              ? "revenue"
              : "shipping",
          weakest_area:
            metrics.customer_completion_rate <=
              metrics.revenue_completion_rate &&
            metrics.customer_completion_rate <= metrics.shipping_completion_rate
              ? "customer"
              : metrics.revenue_completion_rate <=
                metrics.shipping_completion_rate
              ? "revenue"
              : "shipping",
        },
      },
    },
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

    case "create_goal_with_breakdown":
      return executeCreateGoalWithBreakdown(
        createGoalWithBreakdownToolParams.parse(params),
        context
      );

    case "get_entrepreneur_metrics":
      return executeGetEntrepreneurMetrics(params, context);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
