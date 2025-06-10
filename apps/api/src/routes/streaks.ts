import { Hono } from "hono";
import { StreaksService, createSupabaseServerClient } from "@focuspilot/db";

export const streaksRouter = new Hono();

// GET /streaks - Get current streak information
streaksRouter.get("/", async (c) => {
  try {
    const auth = c.get("auth");
    const supabase = createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const streaksService = new StreaksService(supabase);
    const streak = await streaksService.get(auth.user.id);
    return c.json({ success: true, data: streak });
  } catch (error) {
    console.error("Error fetching streak:", error);
    return c.json({ success: false, error: "Failed to fetch streak" }, 500);
  }
});
