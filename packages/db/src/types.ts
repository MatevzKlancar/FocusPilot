// Import the types we need from @focuspilot/types
import type {
  Database,
  DbGoal,
  DbTask,
  DbStreak,
  InsertGoal,
  InsertTask,
  InsertStreak,
  DbUpdateGoal,
  DbUpdateTask,
  DbUpdateStreak,
  TodayTask,
  UserStreak,
} from "@focuspilot/types";

// Re-export types from @focuspilot/types for convenience
export type {
  Database,
  DbGoal,
  DbTask,
  DbStreak,
  InsertGoal,
  InsertTask,
  InsertStreak,
  DbUpdateGoal,
  DbUpdateTask,
  DbUpdateStreak,
  TodayTask,
  UserStreak,
} from "@focuspilot/types";

// Re-export with cleaner names for internal use
export type UpdateGoal = DbUpdateGoal;
export type UpdateTask = DbUpdateTask;
export type UpdateStreak = DbUpdateStreak;
