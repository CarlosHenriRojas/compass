import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/documents/[documentId]/download">,
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { documentId } = await params;
  if (!z.uuid().safeParse(documentId).success) {
    return NextResponse.json({ message: "Documento inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("documents")
    .select("name, storage_bucket, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    return NextResponse.json(
      { message: "Documento não encontrado ou acesso não autorizado." },
      { status: 404 },
    );
  }

  // A consulta acima aplica a autorização e as regras de acesso ao documento.
  // Depois disso, o cliente de servidor assina somente o caminho já autorizado.
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, 60, {
      download: document.name,
    });

  if (error || !data.signedUrl) {
    return NextResponse.json(
      { message: "Não foi possível preparar o download." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
