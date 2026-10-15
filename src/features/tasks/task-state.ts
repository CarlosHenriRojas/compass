import type { TaskActionState } from "@/features/tasks/actions";

export const initialTaskActionState: TaskActionState = {
  status: "idle",
  message: "",
};

