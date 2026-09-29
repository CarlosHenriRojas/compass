import type { AddClientMemberState } from "@/features/clients/member-actions";

export const initialAddClientMemberState: AddClientMemberState = {
  status: "idle",
  message: "",
};
