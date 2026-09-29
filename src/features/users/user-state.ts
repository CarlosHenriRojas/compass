import type { InviteUserState } from "@/features/users/actions";

export const initialInviteUserState: InviteUserState = {
  status: "idle",
  message: "",
};
