import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ChatRequestSchema } from "@focuspilot/types";

export const chatRouter = new Hono();

// POST /chat - Send a message to the AI agent
chatRouter.post("/", zValidator("json", ChatRequestSchema), async (c) => {
  try {
    const auth = c.get("auth");
    const { message } = c.req.valid("json");

    // For now, return a simple response
    // TODO: Integrate with FocusPilotAgent
    return c.json({
      success: true,
      data: {
        message: `Thanks for your message: "${message}". I'm FocusPilot, your AI productivity coach. Let me help you achieve your goals!`,
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
