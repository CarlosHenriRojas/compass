import type { DocumentActionState } from "@/features/documents/actions";

export const initialDocumentActionState: DocumentActionState = {
  status: "idle",
  message: "",
};
