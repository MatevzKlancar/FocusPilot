import type { SupabaseClientType } from "../client.js";
import type {
  DbChatSession,
  DbChatMessage,
  InsertChatSession,
  InsertChatMessage,
  UpdateChatSession,
  UpdateChatMessage,
} from "../types.js";

export class ChatService {
  constructor(private client: SupabaseClientType) {}

  // Chat Sessions
  async getAllSessions(userId: string): Promise<DbChatSession[]> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch chat sessions: ${error.message}`);
    }

    return data || [];
  }

  async getSessionById(
    sessionId: string,
    userId: string
  ): Promise<DbChatSession | null> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No rows returned
      }
      throw new Error(`Failed to fetch chat session: ${error.message}`);
    }

    return data;
  }

  async createSession(session: InsertChatSession): Promise<DbChatSession> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .insert(session)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return data;
  }

  async updateSession(
    sessionId: string,
    userId: string,
    updates: UpdateChatSession
  ): Promise<DbChatSession> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chat session: ${error.message}`);
    }

    return data;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete chat session: ${error.message}`);
    }
  }

  // Chat Messages
  async getSessionMessages(
    sessionId: string,
    userId: string
  ): Promise<DbChatMessage[]> {
    const { data, error } = await this.client
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to fetch chat messages for session: ${error.message}`
      );
    }

    return data || [];
  }

  async createMessage(message: InsertChatMessage): Promise<DbChatMessage> {
    const { data, error } = await this.client
      .from("chat_messages")
      .insert(message)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create chat message: ${error.message}`);
    }

    return data;
  }

  async updateMessage(
    messageId: string,
    userId: string,
    updates: UpdateChatMessage
  ): Promise<DbChatMessage> {
    const { data, error } = await this.client
      .from("chat_messages")
      .update(updates)
      .eq("id", messageId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chat message: ${error.message}`);
    }

    return data;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("chat_messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete chat message: ${error.message}`);
    }
  }

  // Helper method to get or create a session with first message
  async getOrCreateCurrentSession(
    userId: string,
    firstMessage?: string
  ): Promise<DbChatSession> {
    // Try to get the most recent session
    const sessions = await this.getAllSessions(userId);

    if (sessions.length > 0) {
      return sessions[0]; // Most recent session
    }

    // Create a new session if none exist
    const title = firstMessage
      ? this.generateSessionTitle(firstMessage)
      : "New Conversation";

    return await this.createSession({
      user_id: userId,
      title,
    });
  }

  // Helper method to generate session title from first message
  private generateSessionTitle(firstMessage: string): string {
    // Take first 50 characters and add ellipsis if longer
    const title = firstMessage.slice(0, 50);
    return firstMessage.length > 50 ? `${title}...` : title;
  }

  // Helper method to get session with message count
  async getSessionsWithMessageCount(
    userId: string
  ): Promise<(DbChatSession & { message_count: number })[]> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .select(
        `
        *,
        chat_messages(count)
      `
      )
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch sessions with message count: ${error.message}`
      );
    }

    return (data || []).map((session) => ({
      ...session,
      message_count: session.chat_messages?.[0]?.count || 0,
    }));
  }
}
