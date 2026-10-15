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

function safeFilename(filename: string) {
  const normalized = filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-120);
  return normalized || "anexo";
}

export async function POST(request: Request, { params }: RouteContext<"/api/tasks/[id]/attachments">) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ message: "Sessão inválida." }, { status: 401 });
  const { id: taskId } = await params;
  if (!z.uuid().safeParse(taskId).success) return NextResponse.json({ message: "Tarefa inválida." }, { status: 400 });

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ message: "Não foi possível ler o arquivo. Confirme que ele possui no máximo 20 MB." }, { status: 413 }); }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ message: "Selecione um arquivo." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: "O arquivo deve possuir no máximo 20 MB." }, { status: 400 });
  if (!allowedMimeTypes.has(file.type)) return NextResponse.json({ message: "Este tipo de arquivo não é permitido." }, { status: 400 });

  const supabase = await createClient();
  const [{ data: task }, { data: canManage }] = await Promise.all([
    supabase.from("tasks").select("id").eq("id", taskId).is("archived_at", null).maybeSingle(),
    supabase.rpc("can_manage_task", { target_task_id: taskId }),
  ]);
  if (!task) return NextResponse.json({ message: "Tarefa não encontrada." }, { status: 404 });
  if (!canManage) return NextResponse.json({ message: "Você não possui permissão para anexar arquivos nesta tarefa." }, { status: 403 });

  const storagePath = `${taskId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("task-attachments").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ message: "Não foi possível enviar o arquivo ao armazenamento." }, { status: 500 });

  const displayName = String(formData.get("displayName") ?? "").trim() || file.name;
  const { error } = await supabase.from("task_attachments").insert({ task_id: taskId, name: displayName.slice(0, 180), storage_bucket: "task-attachments", storage_path: storagePath, mime_type: file.type, size_bytes: file.size, uploaded_by: profile.id });
  if (error) {
    await supabase.storage.from("task-attachments").remove([storagePath]);
    return NextResponse.json({ message: "O arquivo foi enviado, mas não pôde ser registrado." }, { status: 500 });
  }
  return NextResponse.json({ message: "Anexo enviado com sucesso." }, { status: 201 });
}

