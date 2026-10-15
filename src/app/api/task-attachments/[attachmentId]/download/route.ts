import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: RouteContext<"/api/task-attachments/[attachmentId]/download">) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", request.url));
  const { attachmentId } = await params;
  if (!z.uuid().safeParse(attachmentId).success) return NextResponse.json({ message: "Anexo inválido." }, { status: 400 });

  const supabase = await createClient();
  const { data: attachment } = await supabase.from("task_attachments").select("name, storage_bucket, storage_path").eq("id", attachmentId).maybeSingle();
  if (!attachment) return NextResponse.json({ message: "Anexo não encontrado ou acesso não autorizado." }, { status: 404 });

  const viewOnly = new URL(request.url).searchParams.get("view") === "1";
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(attachment.storage_bucket).createSignedUrl(
    attachment.storage_path,
    60,
    viewOnly ? undefined : { download: attachment.name },
  );
  if (error || !data.signedUrl) return NextResponse.json({ message: "Não foi possível preparar o arquivo." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}

