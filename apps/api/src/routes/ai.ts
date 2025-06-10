import { Hono } from "hono";
import OpenAI from "openai";
import {
  GoalsService,
  TasksService,
  StreaksService,
  getDefaultClient,
} from "@focuspilot/db";

const ai = new Hono();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// FocusPilot system prompt
const SYSTEM_PROMPT = `You are FocusPilot, a friendly and motivational productivity coach designed to help users fight procrastination and achieve their goals.

## Your Core Personality:
- **Supportive & Encouraging**: Always praise effort and progress, no matter how small
- **Non-judgmental**: Never criticize or shame users for missing tasks or breaking streaks
- **Action-oriented**: Break big ambitions into bite-sized, actionable next steps
- **Motivational**: Use positive language and emojis to keep energy high
- **Practical**: Focus on realistic, achievable goals and tasks

## Your Main Functions:
1. **Goal Discovery**: Help users identify meaningful goals when they're unsure
2. **Goal Decomposition**: Break large goals into smaller, manageable tasks
3. **Task Scheduling**: Suggest realistic due dates and cadences for tasks
4. **Progress Tracking**: Celebrate completed tasks and maintain streaks
5. **Motivation**: Provide encouragement and help users get back on track

## Guidelines:
- Always break goals into specific, time-bound tasks (daily, weekly, or monthly)
- When creating tasks, consider the user's current commitments and be realistic
- Celebrate streaks and completed tasks enthusiastically
- If someone breaks a streak, focus on getting back on track rather than the failure
- Use casual, friendly language like you're a supportive friend
- Include relevant emojis to make interactions more engaging
- Keep responses conversational and under 200 words unless asked for detailed plans

Remember: Your goal is to help users build sustainable habits and achieve meaningful goals through consistent, manageable daily actions. Be their biggest cheerleader! 🎯`;

// AI chat for coaching
ai.post("/chat", async (c) => {
  try {
    const auth = c.get("auth");
    const body = await c.req.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // Get user's context from database
    const supabase = getDefaultClient();

    const goalsService = new GoalsService(supabase);
    const tasksService = new TasksService(supabase);
    const streaksService = new StreaksService(supabase);

    // Fetch user data in parallel
    const [goals, allTasks, streak] = await Promise.all([
      goalsService.getAll(auth.userId),
      tasksService.getAll(auth.userId),
      streaksService.getUserStreak(auth.userId),
    ]);

    // Calculate relevant metrics
    const today = new Date().toISOString().split("T")[0];
    const todayTasks = allTasks.filter((task) => task.due_date === today);
    const completedTasks = allTasks.filter((task) => task.completed_at);
    const todayCompleted = todayTasks.filter((task) => task.completed_at);
    const pendingTasks = todayTasks.filter((task) => !task.completed_at);

    // Build context string
    const userContext = `
CURRENT USER STATUS:
- Goals: ${goals.length} active goals
- Current Streak: ${streak?.current_streak || 0} days
- Best Streak: ${streak?.best_streak || 0} days
- Total Tasks: ${allTasks.length}
- Completed Tasks: ${completedTasks.length}
- Today's Tasks: ${todayTasks.length} (${todayCompleted.length} completed, ${
      pendingTasks.length
    } pending)

ACTIVE GOALS:
${goals
  .map((goal) => `• ${goal.title}: ${goal.description || "No description"}`)
  .join("\n")}

TODAY'S PENDING TASKS:
${
  pendingTasks.length > 0
    ? pendingTasks
        .map(
          (task) => `• ${task.title}: ${task.description || "No description"}`
        )
        .join("\n")
    : "• No pending tasks for today! 🎉"
}

TODAY'S COMPLETED TASKS:
${
  todayCompleted.length > 0
    ? todayCompleted.map((task) => `• ✅ ${task.title}`).join("\n")
    : "• No tasks completed today yet"
}`;

    // Build conversation messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${userContext}` },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I'm here to help! Could you tell me more about what you're working on?";

    return c.json({ message: response });
  } catch (error) {
    console.error("AI chat error:", error);

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes("API key")) {
      return c.json(
        {
          error:
            "AI service is not properly configured. Please check API settings.",
        },
        500
      );
    }

    return c.json(
      {
        error:
          "I'm having some technical difficulties, but I'm still here to help! Try asking me again in a moment. 🤖💙",
      },
      500
    );
  }
});

// Task-specific AI chat for focused coaching
ai.post("/task-chat", async (c) => {
  try {
    const auth = c.get("auth");
    const body = await c.req.json();
    const { message, task, conversationHistory = [] } = body;

    if (!message || !task) {
      return c.json({ error: "Message and task are required" }, 400);
    }

    // Enhanced system prompt for task-specific coaching
    const TASK_COACHING_PROMPT = `You are FocusPilot, a specialized AI productivity coach focused on helping users with specific tasks. You're currently helping with the task: "${
      task.title
    }".

## Your Role for This Task:
- **Task Specialist**: Focus specifically on this one task
- **Productivity Coach**: Suggest techniques, time management, and focus strategies
- **Motivational Support**: Provide encouragement and help overcome obstacles
- **Practical Helper**: Break down complex tasks into actionable steps

## Task-Specific Coaching Areas:
1. **Task Breakdown**: Help split large tasks into smaller, manageable pieces
2. **Time Management**: Suggest time estimates, scheduling, and techniques like Pomodoro
3. **Obstacle Resolution**: Help identify and overcome blockers or procrastination
4. **Focus Techniques**: Suggest ways to maintain concentration and avoid distractions
5. **Energy Management**: Match task difficulty to user's energy levels
6. **Progress Tracking**: Celebrate small wins and maintain momentum

## Guidelines for Task Coaching:
- Keep responses focused on THIS specific task
- Be practical and actionable - avoid generic advice
- Ask clarifying questions to understand what's blocking them
- Suggest specific next actions they can take right now
- Match your energy to theirs - motivational when they need it, practical when they're ready to act
- Use casual, friendly language like a supportive friend
- Keep responses under 150 words unless they ask for detailed plans

## Current Task Context:
- **Title**: ${task.title}
- **Description**: ${task.description || "No description provided"}
- **Due Date**: ${task.due_date || "No due date set"}
- **Status**: ${task.completed_at ? "Completed" : "Pending"}
- **Associated Goal**: ${task.goals?.title || "No associated goal"}
- **Is Recurring**: ${task.is_recurring ? `Yes (${task.cadence})` : "No"}

Remember: You're helping with ONE specific task. Stay focused, be practical, and help them take the next step! 🎯`;

    // Get user's broader context for additional insights
    const supabase = getDefaultClient();
    const tasksService = new TasksService(supabase);
    const streaksService = new StreaksService(supabase);

    // Fetch relevant user data
    const [allTasks, streak] = await Promise.all([
      tasksService.getAll(auth.userId),
      streaksService.getUserStreak(auth.userId),
    ]);

    // Calculate user context
    const today = new Date().toISOString().split("T")[0];
    const todayTasks = allTasks.filter((t) => t.due_date === today);
    const completedToday = todayTasks.filter((t) => t.completed_at).length;
    const pendingToday = todayTasks.length - completedToday;

    // Build additional context
    const currentStreak = streak?.current_streak || 0;
    const userContext = `
USER CONTEXT:
- Current Streak: ${currentStreak} days
- Today's Progress: ${completedToday}/${todayTasks.length} tasks completed
- Remaining today: ${pendingToday} tasks
- Overall completion rate: ${Math.round(
      (allTasks.filter((t) => t.completed_at).length / allTasks.length) * 100
    )}%

CURRENT ENERGY INDICATORS:
- ${
      completedToday > 0
        ? "✅ Already completed tasks today - good momentum!"
        : "⏳ No tasks completed yet today"
    }
- ${
      pendingToday <= 2
        ? "🎯 Light workload today - good focus opportunity"
        : "📋 Busy day ahead - prioritization important"
    }
- ${
      currentStreak >= 3
        ? "🔥 Strong streak going - maintain the momentum!"
        : "🚀 Building consistency - every task counts!"
    }`;

    // Build conversation messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: `${TASK_COACHING_PROMPT}\n\n${userContext}` },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI API with task-specific configuration
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.8, // Slightly higher for more creative coaching
      max_tokens: 250,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I'm here to help with this task! What specifically would you like to work on?";

    return c.json({ message: response });
  } catch (error) {
    console.error("Task-specific AI chat error:", error);

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes("API key")) {
      return c.json(
        {
          error:
            "AI service is not properly configured. Please check API settings.",
        },
        500
      );
    }

    return c.json(
      {
        error:
          "I'm having some technical difficulties with task coaching right now, but I'm still here to help! Try asking me again in a moment. 🤖💙",
      },
      500
    );
  }
});

export { ai };
