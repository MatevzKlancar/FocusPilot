import type { SupabaseClientType } from "../client.js";
import type { DbGoal, InsertGoal, UpdateGoal } from "../types.js";

export class GoalsService {
  constructor(private client: SupabaseClientType) {}

  async getAll(userId: string): Promise<DbGoal[]> {
    const { data, error } = await this.client
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch goals: ${error.message}`);
    }

    return data || [];
  }

  async getById(id: string, userId: string): Promise<DbGoal | null> {
    const { data, error } = await this.client
      .from("goals")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch goal: ${error.message}`);
    }

    return data;
  }

  async create(goal: InsertGoal): Promise<DbGoal> {
    const { data, error } = await this.client
      .from("goals")
      .insert(goal)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create goal: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    userId: string,
    updates: UpdateGoal
  ): Promise<DbGoal> {
    const { data, error } = await this.client
      .from("goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update goal: ${error.message}`);
    }

    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }
  }

  async getWithTaskCount(
    userId: string
  ): Promise<(DbGoal & { task_count: number })[]> {
    const { data, error } = await this.client
      .from("goals")
      .select(
        `
        *,
        tasks(count)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch goals with task count: ${error.message}`
      );
    }

    return (data || []).map((goal) => ({
      ...goal,
      task_count: goal.tasks?.[0]?.count || 0,
    }));
  }
}
