import type { ServiceActionState } from "@/features/services/actions";

export const initialServiceActionState: ServiceActionState = {
  status: "idle",
  message: "",
};
