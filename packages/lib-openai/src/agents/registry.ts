import type { AgentConfig, AgentType } from "./types.js";
import { appBuilderConfig } from "./app-builder.js";
import { performanceCoachConfig } from "./performance-coach.js";
import { masterCraftsmanConfig } from "./master-craftsman.js";
import { systemsEngineerConfig } from "./systems-engineer.js";

// Agent Registry - Central source of truth for all agents
export const agentRegistry = new Map<AgentType, AgentConfig>([
  ["app-builder", appBuilderConfig],
  ["performance-coach", performanceCoachConfig],
  ["master-craftsman", masterCraftsmanConfig],
  ["systems-engineer", systemsEngineerConfig],
]);

// Get all available agents
export function getAvailableAgents(): AgentConfig[] {
  return Array.from(agentRegistry.values()).filter((agent) => agent.available);
}

// Get all agents (including coming soon)
export function getAllAgents(): AgentConfig[] {
  return Array.from(agentRegistry.values());
}

// Get agent by ID
export function getAgent(agentId: AgentType): AgentConfig | undefined {
  return agentRegistry.get(agentId);
}

// Select optimal agent based on goal type
export function selectAgentForGoalType(goalType: string): AgentConfig {
  // Find agent that specializes in this goal type and is available
  for (const agent of agentRegistry.values()) {
    if (agent.available && agent.goalTypes.includes(goalType)) {
      return agent;
    }
  }

  // Fallback to app-builder (always available)
  return appBuilderConfig;
}

// Select agent based on multiple goal types (user's current goals)
export function selectAgentForGoalTypes(goalTypes: string[]): AgentConfig {
  if (goalTypes.length === 0) {
    return appBuilderConfig; // Default agent
  }

  // Count matches for each available agent
  const agentScores = new Map<AgentType, number>();

  for (const agent of getAvailableAgents()) {
    const matches = goalTypes.filter((type) =>
      agent.goalTypes.includes(type)
    ).length;
    if (matches > 0) {
      agentScores.set(agent.id as AgentType, matches);
    }
  }

  // Return agent with highest score, or default to app-builder
  if (agentScores.size === 0) {
    return appBuilderConfig;
  }

  const bestAgentId = Array.from(agentScores.entries()).sort(
    ([, a], [, b]) => b - a
  )[0][0];

  return getAgent(bestAgentId) || appBuilderConfig;
}

// Check if user should be suggested to switch agents
export function shouldSuggestAgentSwitch(
  currentAgentId: AgentType,
  userGoalTypes: string[]
): { shouldSwitch: boolean; suggestedAgent?: AgentConfig; reason?: string } {
  const currentAgent = getAgent(currentAgentId);
  const optimalAgent = selectAgentForGoalTypes(userGoalTypes);

  if (!currentAgent || currentAgent.id === optimalAgent.id) {
    return { shouldSwitch: false };
  }

  // Check if optimal agent handles user's goals significantly better
  const currentMatches = userGoalTypes.filter((type) =>
    currentAgent.goalTypes.includes(type)
  ).length;

  const optimalMatches = userGoalTypes.filter((type) =>
    optimalAgent.goalTypes.includes(type)
  ).length;

  if (optimalMatches > currentMatches && optimalAgent.available) {
    return {
      shouldSwitch: true,
      suggestedAgent: optimalAgent,
      reason: `${optimalAgent.name} specializes in ${optimalMatches}/${userGoalTypes.length} of your goal types vs ${currentMatches}/${userGoalTypes.length} for ${currentAgent.name}`,
    };
  }

  return { shouldSwitch: false };
}

// TODO: Add agent switching history tracking
// TODO: Add user agent preferences storage
// TODO: Add A/B testing for agent effectiveness
// TODO: Add agent performance metrics
