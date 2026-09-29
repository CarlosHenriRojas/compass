export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string[]>>;
};

export const initialAuthState: AuthActionState = {
  status: "idle",
  message: "",
};
