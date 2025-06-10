import type { SupabaseClientType } from "../client.js";
import type { DbTask, InsertTask, UpdateTask, TodayTask } from "../types.js";

export class TasksService {
  constructor(private client: SupabaseClientType) {}

  async getAll(
    userId: string,
    filters?: {
      goalId?: string;
      date?: string;
      completed?: boolean;
    }
  ): Promise<DbTask[]> {
    let query = this.client.from("tasks").select("*").eq("user_id", userId);

    if (filters?.goalId) {
      query = query.eq("goal_id", filters.goalId);
    }

    if (filters?.date) {
      query = query.eq("due_date", filters.date);
    }

    if (filters?.completed !== undefined) {
      if (filters.completed) {
        query = query.not("completed_at", "is", null);
      } else {
        query = query.is("completed_at", null);
      }
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }

  async getById(id: string, userId: string): Promise<DbTask | null> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    return data;
  }

  async getTodayTasks(userId: string): Promise<TodayTask[]> {
    const { data, error } = await this.client.rpc("get_today_tasks", {
      user_uuid: userId,
    });

    if (error) {
      throw new Error(`Failed to fetch today's tasks: ${error.message}`);
    }

    return data || [];
  }

  async create(task: InsertTask): Promise<DbTask> {
    const { data, error } = await this.client
      .from("tasks")
      .insert(task)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    userId: string,
    updates: UpdateTask
  ): Promise<DbTask> {
    const { data, error } = await this.client
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return data;
  }

  async complete(id: string, userId: string): Promise<DbTask> {
    const { data, error } = await this.client
      .from("tasks")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }

    return data;
  }

  async uncomplete(id: string, userId: string): Promise<DbTask> {
    const { data, error } = await this.client
      .from("tasks")
      .update({ completed_at: null })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to uncomplete task: ${error.message}`);
    }

    return data;
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  async getByGoal(goalId: string, userId: string): Promise<DbTask[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("goal_id", goalId)
      .eq("user_id", userId)
      .order("due_date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch tasks for goal: ${error.message}`);
    }

    return data || [];
  }
}
