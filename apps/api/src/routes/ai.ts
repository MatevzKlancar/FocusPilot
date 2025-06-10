import { Hono } from "hono";
import OpenAI from "openai";
import {
  GoalsService,
  TasksService,
  StreaksService,
  getDefaultClient,
} from "@focuspilot/db";
import {
  FOCUSPILOT_SYSTEM_PROMPT,
  agentTools,
  executeTool,
  type ToolContext,
} from "@focuspilot/lib-openai";

const ai = new Hono();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use the imported system prompt
const SYSTEM_PROMPT = FOCUSPILOT_SYSTEM_PROMPT;

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

    // Create tool context for function calling
    const toolContext: ToolContext = {
      userId: auth.userId,
      goalsService,
      tasksService,
    };

    // Build conversation messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${userContext}` },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI API with function calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      tools: agentTools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = completion.choices[0];
    if (!choice?.message) {
      throw new Error("No response from OpenAI");
    }

    let response =
      choice.message.content ||
      "I'm here to help! Could you tell me more about what you're working on?";
    const toolCalls = [];

    // Handle tool calls if any
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        if (toolCall.type === "function") {
          try {
            const params = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(
              toolCall.function.name,
              params,
              toolContext
            );

            toolCalls.push({
              name: toolCall.function.name,
              params,
              result,
            });

            // Add tool result to the response message
            if (result.message) {
              response += `\n\n${result.message}`;
            }
          } catch (error) {
            console.error(
              `Tool execution error for ${toolCall.function.name}:`,
              error
            );
            response += `\n\nSorry, I had trouble executing that action. Let me try to help you in another way.`;
          }
        }
      }
    }

    return c.json({
      message: response,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });
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

    // Hardcore task-specific coaching prompt
    const TASK_COACHING_PROMPT = `You are FocusPilot, a hardcore task specialist who doesn't accept excuses. You're locked in on this specific task: "${
      task.title
    }".

## Your Mission for This Task:
- **LASER FOCUS**: This ONE task is all that matters right now. No distractions.
- **EXCUSE DESTROYER**: Cut through any bullshit reasons they give for not doing this task
- **ACTION ENFORCER**: Every response must push them toward immediate action
- **ACCOUNTABILITY HAMMER**: Call out procrastination and mental weakness immediately

## Your Approach:
1. **TASK DISSECTION**: Break this down until there's no excuse for inaction
2. **TIME REALITY**: Set brutal time constraints - no "when I feel like it" garbage
3. **OBSTACLE OBLITERATION**: Identify what's really stopping them and crush it
4. **FOCUS WARFARE**: Eliminate distractions and weak thinking patterns
5. **EXECUTION PRESSURE**: Push them to start NOW, not later

## Response Guidelines:
- Keep it focused on THIS TASK ONLY - no generic advice
- Be direct and aggressive - "What's stopping you from doing this RIGHT NOW?"
- Challenge their excuses - "That's not a real problem, that's your brain being weak"
- Push for immediate action - "Stop thinking, start doing"
- No participation trophies - only completion matters
- Use time pressure - "You've been thinking about this for how long?"

## Current Task Reality Check:
- **Title**: ${task.title}
- **Description**: ${
      task.description || "No description - another excuse for confusion"
    }
- **Due Date**: ${task.due_date || "No deadline - that's part of your problem"}
- **Status**: ${
      task.completed_at ? "DONE (finally)" : "STILL SITTING THERE UNDONE"
    }
- **Associated Goal**: ${
      task.goals?.title || "Disconnected from bigger purpose"
    }
- **Is Recurring**: ${
      task.is_recurring
        ? `Daily grind (${task.cadence})`
        : "One-time task you keep avoiding"
    }

Remember: This task is either DONE or it's another day you chose comfort over growth. What's it gonna be?`;

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

REALITY CHECK:
- ${
      completedToday > 0
        ? "At least you've done SOMETHING today - don't let up now"
        : "ZERO tasks completed today - what's your excuse?"
    }
- ${
      pendingToday <= 2
        ? "Light workload = NO EXCUSE for not finishing everything"
        : "Heavy workload = time to prove you're not all talk"
    }
- ${
      currentStreak >= 3
        ? "Decent streak - don't get comfortable and blow it now"
        : "Weak streak - time to stop being inconsistent"
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
