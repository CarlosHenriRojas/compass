import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const metadataSchema = z.object({
  category: z.enum([
    "CONTRACT",
    "BRIEFING",
    "PLANNING",
    "REPORT",
    "CLIENT_MATERIAL",
    "OTHER",
  ]),
  contractId: z.uuid().or(z.literal("")).transform((value) => value || null),
  displayName: z
    .string()
    .trim()
    .max(180, "O nome do documento é muito longo.")
    .transform((value) => value || null),
});

function safeFilename(filename: string) {
  const normalized = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);

  return normalized || "documento";
}

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/clients/[id]/documents">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  }

  const { id: clientId } = await params;
  if (!z.uuid().safeParse(clientId).success) {
    return NextResponse.json({ message: "Cliente inválido." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "Não foi possível ler o arquivo. Confirme que ele possui no máximo 20 MB." },
      { status: 413 },
    );
  }
  const file = formData.get("file");
  const metadata = metadataSchema.safeParse({
    category: formData.get("category"),
    contractId: formData.get("contractId"),
    displayName: formData.get("displayName"),
  });

  if (!metadata.success) {
    return NextResponse.json(
      {
        message:
          metadata.error.issues[0]?.message ??
          "Revise as informações do documento.",
      },
      { status: 400 },
    );
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { message: "Selecione um arquivo." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "O arquivo deve possuir no máximo 20 MB." },
      { status: 400 },
    );
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { message: "Este tipo de arquivo não é permitido." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .is("archived_at", null)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ message: "Cliente não encontrado." }, { status: 404 });
  }

  if (metadata.data.category === "CONTRACT") {
    if (profile.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Somente administradores podem enviar contratos." },
        { status: 403 },
      );
    }

    if (!metadata.data.contractId) {
      return NextResponse.json(
        { message: "Selecione o contrato relacionado." },
        { status: 400 },
      );
    }

    const { data: contract } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", metadata.data.contractId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!contract) {
      return NextResponse.json(
        { message: "O contrato selecionado não pertence a este cliente." },
        { status: 400 },
      );
    }
  } else if (profile.role !== "ADMIN") {
    const { data: membership } = await supabase
      .from("client_members")
      .select("id")
      .eq("client_id", clientId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json(
        { message: "Você não faz parte da equipe deste cliente." },
        { status: 403 },
      );
    }
  }

  const folder =
    metadata.data.category === "CONTRACT" ? "contracts" : "documents";
  const storagePath = `${clientId}/${folder}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { message: "Não foi possível enviar o arquivo ao armazenamento." },
      { status: 500 },
    );
  }

  const displayName = metadata.data.displayName ?? file.name;
  const { error: documentError } = await supabase.from("documents").insert({
    client_id: clientId,
    contract_id:
      metadata.data.category === "CONTRACT"
        ? metadata.data.contractId
        : null,
    name: displayName.slice(0, 180),
    category: metadata.data.category,
    storage_bucket: "documents",
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: profile.id,
  });

  if (documentError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return NextResponse.json(
      { message: "O arquivo foi enviado, mas não pôde ser registrado." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { message: "Documento enviado com sucesso." },
    { status: 201 },
  );
}
