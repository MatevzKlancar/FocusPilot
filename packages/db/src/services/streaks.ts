import type { SupabaseClientType } from "../client.js";
import type {
  DbStreak,
  InsertStreak,
  UpdateStreak,
  UserStreak,
} from "../types.js";

export class StreaksService {
  constructor(private client: SupabaseClientType) {}

  async get(userId: string): Promise<DbStreak | null> {
    const { data, error } = await this.client
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch streak: ${error.message}`);
    }

    return data;
  }

  async getUserStreak(userId: string): Promise<UserStreak | null> {
    const { data, error } = await this.client.rpc("get_user_streak", {
      user_uuid: userId,
    });

    if (error) {
      throw new Error(`Failed to fetch user streak: ${error.message}`);
    }

    return data?.[0] || null;
  }

  async create(streak: InsertStreak): Promise<DbStreak> {
    const { data, error } = await this.client
      .from("streaks")
      .insert(streak)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create streak: ${error.message}`);
    }

    return data;
  }

  async update(userId: string, updates: UpdateStreak): Promise<DbStreak> {
    const { data, error } = await this.client
      .from("streaks")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update streak: ${error.message}`);
    }

    return data;
  }

  async upsert(streak: InsertStreak): Promise<DbStreak> {
    const { data, error } = await this.client
      .from("streaks")
      .upsert(streak)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert streak: ${error.message}`);
    }

    return data;
  }

  async initialize(userId: string): Promise<DbStreak> {
    const streak: InsertStreak = {
      user_id: userId,
      current_streak: 0,
      best_streak: 0,
    };

    return this.upsert(streak);
  }

  async reset(userId: string): Promise<DbStreak> {
    const updates: UpdateStreak = {
      current_streak: 0,
      last_activity: null,
    };

    return this.update(userId, updates);
  }

  async incrementStreak(userId: string): Promise<void> {
    // This will be handled by the database trigger automatically
    // when a task is completed, but we can also call it manually
    const { error } = await this.client.rpc("update_streak");

    if (error) {
      throw new Error(`Failed to update streak: ${error.message}`);
    }
  }
}
