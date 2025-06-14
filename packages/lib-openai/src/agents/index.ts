// Agent system exports
export type {
  AgentConfig,
  AgentMessage,
  AgentResponse,
  AgentType,
  AgentContext,
} from "./types.js";

// Agent configurations
export { appBuilderConfig, APP_BUILDER_PROMPT } from "./app-builder.js";
export { performanceCoachConfig } from "./performance-coach.js";
export { masterCraftsmanConfig } from "./master-craftsman.js";
export { systemsEngineerConfig } from "./systems-engineer.js";

// Agent registry and selection
export {
  agentRegistry,
  getAvailableAgents,
  getAllAgents,
  getAgent,
  selectAgentForGoalType,
  selectAgentForGoalTypes,
  shouldSuggestAgentSwitch,
} from "./registry.js";
