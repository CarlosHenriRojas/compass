import type { GoalActionState } from "@/features/goals/actions";

export const initialGoalActionState: GoalActionState = {
  status: "idle",
  message: "",
};
