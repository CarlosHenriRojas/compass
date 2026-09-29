import type { CreateClientState } from "@/features/clients/actions";

export const initialCreateClientState: CreateClientState = {
  status: "idle",
  message: "",
};
