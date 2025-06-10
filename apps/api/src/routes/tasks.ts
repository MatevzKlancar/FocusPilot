import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateTaskSchema, UpdateTaskSchema } from "@focuspilot/types";
import { TasksService, createSupabaseServerClient } from "@focuspilot/db";

export const tasksRouter = new Hono();

// GET /tasks - Get all tasks for the authenticated user
tasksRouter.get("/", async (c) => {
  try {
    const auth = c.get("auth");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const tasksService = new TasksService(supabase);
    const tasks = await tasksService.getAll(auth.user.id);
    return c.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ success: false, error: "Failed to fetch tasks" }, 500);
  }
});

// GET /tasks/today - Get today's tasks
tasksRouter.get("/today", async (c) => {
  try {
    const auth = c.get("auth");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const tasksService = new TasksService(supabase);
    const tasks = await tasksService.getTodayTasks(auth.user.id);
    return c.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return c.json(
      { success: false, error: "Failed to fetch today's tasks" },
      500
    );
  }
});

// POST /tasks - Create a new task
tasksRouter.post("/", zValidator("json", CreateTaskSchema), async (c) => {
  try {
    const auth = c.get("auth");
    const taskData = c.req.valid("json");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const tasksService = new TasksService(supabase);

    const task = await tasksService.create({
      ...taskData,
      user_id: auth.user.id,
    });

    return c.json({ success: true, data: task }, 201);
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json({ success: false, error: "Failed to create task" }, 500);
  }
});

// PATCH /tasks/:id/complete - Mark task as completed
tasksRouter.patch("/:id/complete", async (c) => {
  try {
    const auth = c.get("auth");
    const taskId = c.req.param("id");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const tasksService = new TasksService(supabase);

    const task = await tasksService.complete(taskId, auth.user.id);

    return c.json({ success: true, data: task });
  } catch (error) {
    console.error("Error completing task:", error);
    return c.json({ success: false, error: "Failed to complete task" }, 500);
  }
});

// PATCH /tasks/:id - Update a task
tasksRouter.patch("/:id", zValidator("json", UpdateTaskSchema), async (c) => {
  try {
    const auth = c.get("auth");
    const taskId = c.req.param("id");
    const updates = c.req.valid("json");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const tasksService = new TasksService(supabase);

    const task = await tasksService.update(taskId, auth.user.id, updates);

    return c.json({ success: true, data: task });
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json({ success: false, error: "Failed to update task" }, 500);
  }
});

// DELETE /tasks/:id - Delete a task
tasksRouter.delete("/:id", async (c) => {
  try {
    const auth = c.get("auth");
    const taskId = c.req.param("id");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const tasksService = new TasksService(supabase);

    await tasksService.delete(taskId, auth.user.id);

    return c.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json({ success: false, error: "Failed to delete task" }, 500);
  }
});
