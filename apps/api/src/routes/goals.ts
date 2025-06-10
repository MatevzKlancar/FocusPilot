import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateGoalSchema, UpdateGoalSchema } from "@focuspilot/types";
import { GoalsService, createSupabaseServerClient } from "@focuspilot/db";

export const goalsRouter = new Hono();

// GET /goals - Get all goals for the authenticated user
goalsRouter.get("/", async (c) => {
  try {
    const auth = c.get("auth");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const goalsService = new GoalsService(supabase);
    const goals = await goalsService.getAll(auth.user.id);
    return c.json({ success: true, data: goals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return c.json({ success: false, error: "Failed to fetch goals" }, 500);
  }
});

// GET /goals/:id - Get a specific goal
goalsRouter.get("/:id", async (c) => {
  try {
    const auth = c.get("auth");
    const goalId = c.req.param("id");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const goalsService = new GoalsService(supabase);
    const goal = await goalsService.getById(goalId, auth.user.id);

    if (!goal) {
      return c.json({ success: false, error: "Goal not found" }, 404);
    }

    return c.json({ success: true, data: goal });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return c.json({ success: false, error: "Failed to fetch goal" }, 500);
  }
});

// POST /goals - Create a new goal
goalsRouter.post("/", zValidator("json", CreateGoalSchema), async (c) => {
  try {
    const auth = c.get("auth");
    const goalData = c.req.valid("json");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const goalsService = new GoalsService(supabase);

    const goal = await goalsService.create({
      ...goalData,
      user_id: auth.user.id,
    });

    return c.json({ success: true, data: goal }, 201);
  } catch (error) {
    console.error("Error creating goal:", error);
    return c.json({ success: false, error: "Failed to create goal" }, 500);
  }
});

// PATCH /goals/:id - Update a goal
goalsRouter.patch("/:id", zValidator("json", UpdateGoalSchema), async (c) => {
  try {
    const auth = c.get("auth");
    const goalId = c.req.param("id");
    const updates = c.req.valid("json");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const goalsService = new GoalsService(supabase);

    const goal = await goalsService.update(goalId, auth.user.id, updates);

    return c.json({ success: true, data: goal });
  } catch (error) {
    console.error("Error updating goal:", error);
    return c.json({ success: false, error: "Failed to update goal" }, 500);
  }
});

// DELETE /goals/:id - Delete a goal
goalsRouter.delete("/:id", async (c) => {
  try {
    const auth = c.get("auth");
    const goalId = c.req.param("id");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const goalsService = new GoalsService(supabase);

    await goalsService.delete(goalId, auth.user.id);

    return c.json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return c.json({ success: false, error: "Failed to delete goal" }, 500);
  }
});
