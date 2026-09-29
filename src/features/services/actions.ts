"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ServiceActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço.").max(100, "Use no máximo 100 caracteres."),
  description: z.string().trim().max(500, "Use no máximo 500 caracteres.").transform((value) => value || null),
  sortOrder: z.coerce.number().int().min(0, "Use um número positivo.").max(9999, "Use um número menor."),
  active: z.boolean(),
});

function parseService(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
    active: formData.get("active") === "on",
  });
}

function errorState(parsed: ReturnType<typeof parseService>): ServiceActionState | null {
  if (parsed.success) return null;
  return {
    status: "error",
    message: "Revise os campos destacados.",
    fieldErrors: parsed.error.flatten().fieldErrors,
  };
}

export async function createServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  await requireAdmin();
  const parsed = parseService(formData);
  const validationError = errorState(parsed);
  if (validationError || !parsed.success) return validationError!;

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    name: parsed.data.name,
    description: parsed.data.description,
    sort_order: parsed.data.sortOrder,
    active: parsed.data.active,
  });
  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Já existe um serviço com este nome." : "Não foi possível criar o serviço.",
      fieldErrors: error.code === "23505" ? { name: ["Use outro nome."] } : undefined,
    };
  }

  revalidatePath("/settings/services");
  revalidatePath("/clients/new");
  return { status: "success", message: "Serviço criado." };
}

export async function updateServiceAction(
  serviceId: string,
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(serviceId);
  if (!id.success) return { status: "error", message: "Serviço inválido." };

  const parsed = parseService(formData);
  const validationError = errorState(parsed);
  if (validationError || !parsed.success) return validationError!;

  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      sort_order: parsed.data.sortOrder,
      active: parsed.data.active,
    })
    .eq("id", id.data);
  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Já existe um serviço com este nome." : "Não foi possível atualizar o serviço.",
      fieldErrors: error.code === "23505" ? { name: ["Use outro nome."] } : undefined,
    };
  }

  revalidatePath("/settings/services");
  revalidatePath("/clients");
  revalidatePath("/clients/new");
  return { status: "success", message: "Serviço atualizado." };
}
