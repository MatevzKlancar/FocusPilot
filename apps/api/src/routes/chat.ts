import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ChatRequestSchema } from "@focuspilot/types";
import { FocusPilotAgent } from "@focuspilot/lib-openai";
import { createOpenAIClient } from "@focuspilot/lib-openai";
import { GoalsService, TasksService, getDefaultClient } from "@focuspilot/db";

export const chatRouter = new Hono();

// POST /chat - Send a message to the AI agent
chatRouter.post("/", zValidator("json", ChatRequestSchema), async (c) => {
  try {
    const auth = c.get("auth");
    const { message } = c.req.valid("json");

    // Initialize services and agent
    const supabaseClient = getDefaultClient();
    const goalsService = new GoalsService(supabaseClient);
    const tasksService = new TasksService(supabaseClient);

    const openaiClient = createOpenAIClient({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    const agent = new FocusPilotAgent(openaiClient, {
      userId: auth.userId,
      goalsService,
      tasksService,
    });

    // Process the message with the AI agent
    const response = await agent.processMessage(message);

    return c.json({
      success: true,
      data: {
        message: response.message,
        toolCalls: response.toolCalls,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error processing chat message:", error);
    return c.json({ success: false, error: "Failed to process message" }, 500);
  }
});

// GET /chat/stream - Stream chat responses (Server-Sent Events)
chatRouter.get("/stream", async (c) => {
  try {
    const auth = c.get("auth");

    // TODO: Implement streaming with FocusPilotAgent
    return c.text("Streaming endpoint - coming soon!", 200);
  } catch (error) {
    console.error("Error setting up chat stream:", error);
    return c.json({ success: false, error: "Failed to setup stream" }, 500);
  }
});
