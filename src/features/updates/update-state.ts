import type { WeeklyUpdateActionState } from "@/features/updates/actions";

export const initialWeeklyUpdateActionState: WeeklyUpdateActionState = {
  status: "idle",
  message: "",
};
