"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type CreateClientState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => !value || z.url().safeParse(value).success,
    "Informe uma URL completa e válida.",
  )
  .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => !value || z.email().safeParse(value).success,
    "Informe um e-mail válido.",
  )
  .transform((value) => value || null);

const createClientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe o nome do cliente.")
      .max(160, "O nome é muito longo."),
    legalName: optionalText(180),
    cnpj: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .refine(
        (value) => value.length === 0 || value.length === 14,
        "Informe os 14 dígitos do CNPJ.",
      )
      .transform((value) => value || null),
    segment: optionalText(120),
    city: optionalText(120),
    state: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) => value.length === 0 || /^[A-Z]{2}$/.test(value),
        "Use a sigla da UF com 2 letras.",
      )
      .transform((value) => value || null),
    websiteUrl: optionalUrl,
    instagramUrl: optionalUrl,
    googleBusinessUrl: optionalUrl,
    status: z.enum(["ONBOARDING", "ACTIVE", "PAUSED", "CLOSED"]),
    healthStatus: z
      .enum(["HEALTHY", "ATTENTION", "CRITICAL"])
      .or(z.literal(""))
      .transform((value) => value || null),
    joinedAt: z.iso.date("Informe uma data válida."),
    acquisitionSource: optionalText(120),
    soldByUserId: z.uuid().or(z.literal("")).transform((value) => value || null),
    primaryMemberId: z.uuid("Selecione o responsável principal."),
    contactName: optionalText(120),
    contactPosition: optionalText(100),
    contactPhone: z
      .string()
      .trim()
      .transform((value) => value.replace(/[^\d+]/g, ""))
      .refine(
        (value) => value.length <= 20,
        "O telefone informado é muito longo.",
      )
      .transform((value) => value || null),
    contactEmail: optionalEmail,
    generalNotes: optionalText(3000),
    internalNotes: optionalText(3000),
    serviceIds: z
      .array(z.uuid())
      .min(1, "Selecione pelo menos um serviço."),
  })
  .superRefine((data, context) => {
    if (data.status === "ACTIVE" && !data.healthStatus) {
      context.addIssue({
        code: "custom",
        path: ["healthStatus"],
        message: "Defina a saúde de um cliente ativo.",
      });
    }

    if (
      !data.contactName &&
      (data.contactPosition || data.contactPhone || data.contactEmail)
    ) {
      context.addIssue({
        code: "custom",
        path: ["contactName"],
        message: "Informe o nome do contato principal.",
      });
    }
  });

type DatabaseError = { code?: string; message?: string };

function parseClientFormData(formData: FormData) {
  return createClientSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName"),
    cnpj: formData.get("cnpj"),
    segment: formData.get("segment"),
    city: formData.get("city"),
    state: formData.get("state"),
    websiteUrl: formData.get("websiteUrl"),
    instagramUrl: formData.get("instagramUrl"),
    googleBusinessUrl: formData.get("googleBusinessUrl"),
    status: formData.get("status"),
    healthStatus: formData.get("healthStatus"),
    joinedAt: formData.get("joinedAt"),
    acquisitionSource: formData.get("acquisitionSource"),
    soldByUserId: formData.get("soldByUserId"),
    primaryMemberId: formData.get("primaryMemberId"),
    contactName: formData.get("contactName"),
    contactPosition: formData.get("contactPosition"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    generalNotes: formData.get("generalNotes"),
    internalNotes: formData.get("internalNotes"),
    serviceIds: formData.getAll("serviceIds"),
  });
}

async function validateReferences(
  parsed: z.infer<typeof createClientSchema>,
  supabase: Awaited<ReturnType<typeof createClient>>,
  allowedInactiveServiceIds = new Set<string>(),
): Promise<CreateClientState | null> {
  const { data: validMembers, error: membersError } = await supabase
    .from("profiles")
    .select("id")
    .in(
      "id",
      [parsed.primaryMemberId, parsed.soldByUserId].filter(
        (value): value is string => Boolean(value),
      ),
    )
    .eq("active", true);

  if (membersError) {
    return {
      status: "error",
      message: "Não foi possível validar os responsáveis selecionados.",
    };
  }

  const validMemberIds = new Set(validMembers.map((member) => member.id));
  if (!validMemberIds.has(parsed.primaryMemberId)) {
    return {
      status: "error",
      message: "O responsável principal não está mais disponível.",
      fieldErrors: { primaryMemberId: ["Selecione um usuário ativo."] },
    };
  }

  if (parsed.soldByUserId && !validMemberIds.has(parsed.soldByUserId)) {
    return {
      status: "error",
      message: "O responsável pela venda não está mais disponível.",
      fieldErrors: { soldByUserId: ["Selecione um usuário ativo."] },
    };
  }

  const { data: validServices, error: servicesError } = await supabase
    .from("services")
    .select("id, active")
    .in("id", parsed.serviceIds);

  if (
    servicesError ||
    validServices.length !== new Set(parsed.serviceIds).size ||
    validServices.some(
      (service) => !service.active && !allowedInactiveServiceIds.has(service.id),
    )
  ) {
    return {
      status: "error",
      message: "Um dos serviços selecionados não está mais disponível.",
      fieldErrors: { serviceIds: ["Revise os serviços contratados."] },
    };
  }

  return null;
}

export async function createClientAction(
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const currentProfile = await requireAdmin();
  const parsed = parseClientFormData(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de continuar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const referenceError = await validateReferences(parsed.data, supabase);
  if (referenceError) return referenceError;

  let createdClientId: string | null = null;

  try {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({
        name: parsed.data.name,
        legal_name: parsed.data.legalName,
        cnpj: parsed.data.cnpj,
        segment: parsed.data.segment,
        city: parsed.data.city,
        state: parsed.data.state,
        website_url: parsed.data.websiteUrl,
        instagram_url: parsed.data.instagramUrl,
        google_business_url: parsed.data.googleBusinessUrl,
        status: parsed.data.status,
        health_status: parsed.data.healthStatus,
        joined_at: parsed.data.joinedAt,
        acquisition_source: parsed.data.acquisitionSource,
        sold_by_user_id: parsed.data.soldByUserId,
        general_notes: parsed.data.generalNotes,
        internal_notes: parsed.data.internalNotes,
        created_by: currentProfile.id,
      })
      .select("id")
      .single();

    if (clientError) throw clientError;
    createdClientId = client.id;

    const { error: memberError } = await supabase.from("client_members").insert({
      client_id: client.id,
      user_id: parsed.data.primaryMemberId,
      responsibility: "Responsável principal",
      is_primary: true,
    });
    if (memberError) throw memberError;

    if (parsed.data.contactName) {
      const { error: contactError } = await supabase
        .from("client_contacts")
        .insert({
          client_id: client.id,
          name: parsed.data.contactName,
          position: parsed.data.contactPosition,
          phone: parsed.data.contactPhone,
          email: parsed.data.contactEmail,
          is_primary: true,
        });
      if (contactError) throw contactError;
    }

    const { error: clientServicesError } = await supabase
      .from("client_services")
      .insert(
        parsed.data.serviceIds.map((serviceId) => ({
          client_id: client.id,
          service_id: serviceId,
          scope_description:
            String(formData.get(`serviceScope:${serviceId}`) ?? "")
              .trim()
              .slice(0, 2000) || null,
        })),
      );
    if (clientServicesError) throw clientServicesError;
  } catch (error) {
    if (createdClientId) {
      await supabase.from("clients").delete().eq("id", createdClientId);
    }

    const databaseError = error as DatabaseError;
    return {
      status: "error",
      message:
        databaseError.code === "23505"
          ? "Já existe um cliente com este CNPJ."
          : "Não foi possível cadastrar o cliente. Tente novamente.",
      fieldErrors:
        databaseError.code === "23505"
          ? { cnpj: ["Este CNPJ já está vinculado a outro cliente."] }
          : undefined,
    };
  }

  revalidatePath("/clients");
  redirect(`/clients/${createdClientId}/overview`);
}

export async function updateClientAction(
  clientId: string,
  _previousState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  await requireAdmin();
  const id = z.uuid().safeParse(clientId);
  if (!id.success) {
    return { status: "error", message: "Cliente inválido." };
  }

  const parsed = parseClientFormData(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de continuar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id.data)
    .is("archived_at", null)
    .maybeSingle();
  if (!existingClient) {
    return { status: "error", message: "Cliente não encontrado ou arquivado." };
  }

  const { data: assignedServices, error: assignedServicesError } = await supabase
    .from("client_services")
    .select("service_id")
    .eq("client_id", id.data);
  if (assignedServicesError) {
    return { status: "error", message: "Não foi possível validar os serviços atuais do cliente." };
  }

  const referenceError = await validateReferences(
    parsed.data,
    supabase,
    new Set(assignedServices.map((service) => service.service_id)),
  );
  if (referenceError) return referenceError;

  const { error: clientError } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      legal_name: parsed.data.legalName,
      cnpj: parsed.data.cnpj,
      segment: parsed.data.segment,
      city: parsed.data.city,
      state: parsed.data.state,
      website_url: parsed.data.websiteUrl,
      instagram_url: parsed.data.instagramUrl,
      google_business_url: parsed.data.googleBusinessUrl,
      status: parsed.data.status,
      health_status: parsed.data.healthStatus,
      joined_at: parsed.data.joinedAt,
      acquisition_source: parsed.data.acquisitionSource,
      sold_by_user_id: parsed.data.soldByUserId,
      general_notes: parsed.data.generalNotes,
      internal_notes: parsed.data.internalNotes,
    })
    .eq("id", id.data)
    .is("archived_at", null);

  if (clientError) {
    return {
      status: "error",
      message:
        clientError.code === "23505"
          ? "Já existe um cliente com este CNPJ."
          : "Não foi possível salvar os dados do cliente.",
      fieldErrors:
        clientError.code === "23505"
          ? { cnpj: ["Este CNPJ já está vinculado a outro cliente."] }
          : undefined,
    };
  }

  const { data: members, error: membersError } = await supabase
    .from("client_members")
    .select("id, user_id, is_primary")
    .eq("client_id", id.data);
  if (membersError) {
    return { status: "error", message: "Os dados foram salvos, mas não foi possível atualizar o responsável principal." };
  }

  const selectedMember = members.find(
    (member) => member.user_id === parsed.data.primaryMemberId,
  );
  const previousPrimary = members.find((member) => member.is_primary);
  if (previousPrimary?.user_id !== parsed.data.primaryMemberId) {
    if (previousPrimary) {
      const { error } = await supabase
        .from("client_members")
        .update({ is_primary: false })
        .eq("id", previousPrimary.id);
      if (error) {
        return { status: "error", message: "Os dados foram salvos, mas não foi possível trocar o responsável principal." };
      }
    }

    const memberResult = selectedMember
      ? await supabase
          .from("client_members")
          .update({ is_primary: true, responsibility: "Responsável principal" })
          .eq("id", selectedMember.id)
      : await supabase.from("client_members").insert({
          client_id: id.data,
          user_id: parsed.data.primaryMemberId,
          responsibility: "Responsável principal",
          is_primary: true,
        });
    if (memberResult.error) {
      if (previousPrimary) {
        await supabase
          .from("client_members")
          .update({ is_primary: true })
          .eq("id", previousPrimary.id);
      }
      return { status: "error", message: "Os dados foram salvos, mas não foi possível trocar o responsável principal." };
    }
  }

  const { data: primaryContact, error: contactReadError } = await supabase
    .from("client_contacts")
    .select("id")
    .eq("client_id", id.data)
    .eq("is_primary", true)
    .maybeSingle();
  if (contactReadError) {
    return { status: "error", message: "Os dados foram salvos, mas não foi possível atualizar o contato principal." };
  }

  if (parsed.data.contactName) {
    const contactData = {
      name: parsed.data.contactName,
      position: parsed.data.contactPosition,
      phone: parsed.data.contactPhone,
      email: parsed.data.contactEmail,
      is_primary: true,
    };
    const contactResult = primaryContact
      ? await supabase.from("client_contacts").update(contactData).eq("id", primaryContact.id)
      : await supabase.from("client_contacts").insert({
          client_id: id.data,
          ...contactData,
        });
    if (contactResult.error) {
      return { status: "error", message: "Os dados foram salvos, mas não foi possível atualizar o contato principal." };
    }
  } else if (primaryContact) {
    const { error } = await supabase
      .from("client_contacts")
      .delete()
      .eq("id", primaryContact.id);
    if (error) {
      return { status: "error", message: "Os dados foram salvos, mas não foi possível remover o contato principal." };
    }
  }

  const { data: existingServices, error: servicesReadError } = await supabase
    .from("client_services")
    .select("id, service_id")
    .eq("client_id", id.data);
  if (servicesReadError) {
    return { status: "error", message: "Os dados foram salvos, mas não foi possível atualizar os serviços." };
  }

  const selectedServiceIds = new Set(parsed.data.serviceIds);
  const removedServiceIds = existingServices
    .filter((item) => !selectedServiceIds.has(item.service_id))
    .map((item) => item.id);
  if (removedServiceIds.length) {
    const { error } = await supabase
      .from("client_services")
      .delete()
      .in("id", removedServiceIds);
    if (error) {
      return { status: "error", message: "Os dados foram salvos, mas não foi possível remover um dos serviços." };
    }
  }

  const { error: servicesWriteError } = await supabase
    .from("client_services")
    .upsert(
      parsed.data.serviceIds.map((serviceId) => ({
        client_id: id.data,
        service_id: serviceId,
        scope_description:
          String(formData.get(`serviceScope:${serviceId}`) ?? "")
            .trim()
            .slice(0, 2000) || null,
      })),
      { onConflict: "client_id,service_id" },
    );
  if (servicesWriteError) {
    return { status: "error", message: "Os dados foram salvos, mas não foi possível atualizar o escopo dos serviços." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/pending");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id.data}/overview`);
  redirect(`/clients/${id.data}/overview`);
}

export async function archiveClientAction(clientId: string) {
  await requireAdmin();
  const id = z.uuid().safeParse(clientId);
  if (!id.success) return { ok: false, message: "Cliente inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("archived_at", null);
  if (error) return { ok: false, message: "Não foi possível arquivar o cliente." };

  revalidatePath("/dashboard");
  revalidatePath("/pending");
  revalidatePath("/clients");
  return { ok: true, message: "Cliente arquivado." };
}

export async function restoreClientAction(clientId: string) {
  await requireAdmin();
  const id = z.uuid().safeParse(clientId);
  if (!id.success) return { ok: false, message: "Cliente inválido." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: null })
    .eq("id", id.data)
    .not("archived_at", "is", null);
  if (error) return { ok: false, message: "Não foi possível reativar o cliente." };

  revalidatePath("/clients");
  return { ok: true, message: "Cliente reativado." };
}
