import { Hono } from "hono";
import OpenAI from "openai";
import {
  GoalsService,
  TasksService,
  StreaksService,
  ChatService,
  getDefaultClient,
} from "@focuspilot/db";
import {
  APP_BUILDER_PROMPT,
  agentTools,
  executeTool,
  type ToolContext,
  // TODO: Import new agent system when ready to integrate:
  // selectAgentForGoalTypes,
  // getAvailableAgents,
  // type AgentType
} from "@focuspilot/lib-openai";

const ai = new Hono();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use the App Builder agent prompt (enhanced entrepreneurial coaching)
// TODO: Replace with dynamic agent selection based on user's goal types
const SYSTEM_PROMPT = APP_BUILDER_PROMPT;

// AI chat for coaching
ai.post("/chat", async (c) => {
  try {
    const auth = c.get("auth");
    const body = await c.req.json();
    const { message, conversationHistory = [], session_id } = body;

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // Get user's context from database
    const supabase = getDefaultClient();

    const goalsService = new GoalsService(supabase);
    const tasksService = new TasksService(supabase);
    const streaksService = new StreaksService(supabase);
    const chatService = new ChatService(supabase);

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
          (task) =>
            `• ${task.title}: ${
              task.description || "No description"
            } (Task ID: ${task.id})`
        )
        .join("\n")
    : "• No pending tasks for today! Time to create some business-focused goals."
}

TODAY'S COMPLETED TASKS:
${
  todayCompleted.length > 0
    ? todayCompleted
        .map((task) => `• ✅ ${task.title} (Task ID: ${task.id})`)
        .join("\n")
    : "• No tasks completed today yet"
}

IMPORTANT: 
- Only use the Task IDs shown in parentheses above when calling complete_task tool. Do not make up or guess task IDs.
- NEVER include Task IDs or UUIDs in your responses to users. Users should never see database IDs.
- When referencing tasks in your responses, use only the task title and description.`;

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
      const toolResults = [];

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

            toolResults.push(result);
          } catch (error) {
            console.error(
              `Tool execution error for ${toolCall.function.name}:`,
              error
            );

            // Add context about the error to help the AI respond appropriately
            const errorObj = error as Error;
            toolResults.push({
              success: false,
              action: "tool_error",
              data: {
                tool_name: toolCall.function.name,
                error_type: errorObj.name || "unknown",
                error_message: errorObj.message || "Tool execution failed",
                user_context: {
                  needs_setup:
                    toolCall.function.name === "complete_task" &&
                    errorObj.message?.includes("Invalid uuid"),
                  suggested_action: "create_goal_first",
                },
              },
            });
          }
        }
      }

      // If we have tool results, generate contextual AI response
      if (toolResults.length > 0) {
        const toolContextMessage = toolResults
          .map((result) => {
            if (
              (result.success || result.action === "tool_error") &&
              result.action &&
              result.data
            ) {
              return `TOOL_RESULT: ${result.action}\nCONTEXT: ${JSON.stringify(
                result.data,
                null,
                2
              )}`;
            }
            return null;
          })
          .filter(Boolean)
          .join("\n\n");

        if (toolContextMessage) {
          // Generate a contextual response based on tool results
          const contextualMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: `${SYSTEM_PROMPT}\n\n${userContext}` },
            { role: "user", content: message },
            { role: "assistant", content: response },
            {
              role: "user",
              content: `${toolContextMessage}\n\nGenerate a contextual response based on the tool results above. Use the rich context data to provide intelligent, adaptive feedback that follows your personality and guidelines.`,
            },
          ];

          const contextualCompletion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: contextualMessages,
            temperature: 0.8,
            max_tokens: 400,
          });

          const contextualResponse =
            contextualCompletion.choices[0]?.message?.content;
          if (contextualResponse) {
            response = contextualResponse;
          }
        }
      }
    }

    // Handle chat persistence
    let currentSession;
    try {
      if (session_id) {
        // Use existing session
        currentSession = await chatService.getSessionById(
          session_id,
          auth.userId
        );
        if (!currentSession) {
          // Session not found, create new one
          currentSession = await chatService.createSession({
            user_id: auth.userId,
            title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          });
        }
      } else {
        // Get or create a session
        currentSession = await chatService.getOrCreateCurrentSession(
          auth.userId,
          message
        );
      }

      // Save user message
      await chatService.createMessage({
        session_id: currentSession.id,
        user_id: auth.userId,
        role: "user",
        content: message,
      });

      // Save assistant response
      await chatService.createMessage({
        session_id: currentSession.id,
        user_id: auth.userId,
        role: "assistant",
        content: response,
      });
    } catch (chatError) {
      console.error("Chat persistence error:", chatError);
      // Continue without failing the request
    }

    return c.json({
      message: response,
      session_id: currentSession?.id,
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

// GET /chat/sessions - Get all chat sessions for user
ai.get("/chat/sessions", async (c) => {
  try {
    const auth = c.get("auth");
    const supabase = getDefaultClient();
    const chatService = new ChatService(supabase);

    const sessions = await chatService.getSessionsWithMessageCount(auth.userId);

    return c.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return c.json(
      { success: false, error: "Failed to fetch chat sessions" },
      500
    );
  }
});

// GET /chat/sessions/:sessionId/messages - Get messages for a specific session
ai.get("/chat/sessions/:sessionId/messages", async (c) => {
  try {
    const auth = c.get("auth");
    const sessionId = c.req.param("sessionId");
    const supabase = getDefaultClient();
    const chatService = new ChatService(supabase);

    // Verify session belongs to user
    const session = await chatService.getSessionById(sessionId, auth.userId);
    if (!session) {
      return c.json({ success: false, error: "Session not found" }, 404);
    }

    const messages = await chatService.getSessionMessages(
      sessionId,
      auth.userId
    );

    return c.json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return c.json(
      { success: false, error: "Failed to fetch chat messages" },
      500
    );
  }
});

// POST /chat/sessions - Create a new chat session
ai.post("/chat/sessions", async (c) => {
  try {
    const auth = c.get("auth");
    const body = await c.req.json();
    const { title } = body;

    const supabase = getDefaultClient();
    const chatService = new ChatService(supabase);

    const session = await chatService.createSession({
      user_id: auth.userId,
      title,
    });

    return c.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error creating chat session:", error);
    return c.json(
      { success: false, error: "Failed to create chat session" },
      500
    );
  }
});

// DELETE /chat/sessions/:sessionId - Delete a chat session
ai.delete("/chat/sessions/:sessionId", async (c) => {
  try {
    const auth = c.get("auth");
    const sessionId = c.req.param("sessionId");
    const supabase = getDefaultClient();
    const chatService = new ChatService(supabase);

    await chatService.deleteSession(sessionId, auth.userId);

    return c.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return c.json(
      { success: false, error: "Failed to delete chat session" },
      500
    );
  }
});

export { ai };
