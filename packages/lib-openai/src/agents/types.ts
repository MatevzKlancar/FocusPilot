export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  available: boolean;
  goalTypes: string[];
  systemPrompt: string;
  personality: {
    style: string;
    tone: string;
    focus: string[];
    languagePatterns: string[];
  };
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface AgentResponse {
  message: string;
  agentId: string;
  toolCalls?: Array<{
    name: string;
    params: any;
    result: any;
  }>;
}

export type AgentType =
  | "app-builder" // The Drill Sergeant - for entrepreneurs
  | "performance-coach" // Athletic mindset for fitness
  | "master-craftsman" // Deep work specialist for skills/creative
  | "systems-engineer"; // Habit architect for behavior design

export interface AgentContext {
  userId: string;
  currentGoalTypes: string[];
  recentActivity: {
    completedTasks: number;
    missedTasks: number;
    streakDays: number;
  };
}
