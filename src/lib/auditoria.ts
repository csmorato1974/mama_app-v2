import { supabase } from "@/integrations/supabase/client";

type Auditoria = {
  tabla: string;
  accion: string;
  registroId?: string | null;
  campos?: string[];
};

export async function registrarAuditoria({ tabla, accion, registroId = null, campos = [] }: Auditoria) {
  const { data } = await supabase.auth.getUser();
  const usuarioId = data.user?.id ?? null;

  // La auditoría no debe impedir que se guarde el cambio principal.
  await supabase.from("auditoria").insert({
    tabla,
    accion,
    registro_id: registroId,
    usuario_id: usuarioId,
    detalle: { campos },
  });
}
