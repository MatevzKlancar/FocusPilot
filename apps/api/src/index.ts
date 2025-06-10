import { Hono } from "hono";
import { cors } from "hono/cors";
import { goalsRouter } from "./routes/goals.js";
import { tasksRouter } from "./routes/tasks.js";
import { streaksRouter } from "./routes/streaks.js";
import { chatRouter } from "./routes/chat.js";
import { ai } from "./routes/ai.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authMiddleware } from "./middleware/auth.js";
import { createSupabaseServerClient, setDefaultClient } from "@focuspilot/db";

// Environment variables
const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

// Initialize Supabase client
const supabase = createSupabaseServerClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);
setDefaultClient(supabase);

// Create Hono app
const app = new Hono();

// Global middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://localhost:3000"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
const api = app.basePath("/api");

// Apply auth middleware to all API routes except health
api.use("*", authMiddleware);

// Mount routers
api.route("/goals", goalsRouter);
api.route("/tasks", tasksRouter);
api.route("/streaks", streaksRouter);
api.route("/chat", chatRouter);
api.route("/ai", ai);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

console.log(`🚀 FocusPilot API running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
