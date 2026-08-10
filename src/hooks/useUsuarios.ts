import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { registrarAuditoria } from "@/lib/auditoria";
import type { Rol } from "@/hooks/useSesion";

export type Usuario = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  relacion: string | null;
  activo: boolean;
  aprobado: boolean;
  created_at: string;
  roles: Rol[];
};

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: async (): Promise<Usuario[]> => {
      const [perfiles, roles] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, nombre, telefono, correo, relacion, activo, aprobado, created_at")
          .order("nombre", { ascending: true }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (perfiles.error) throw perfiles.error;
      if (roles.error) throw roles.error;

      return (perfiles.data ?? []).map((p) => ({
        ...p,
        roles: (roles.data ?? [])
          .filter((r) => r.user_id === p.id)
          .map((r) => r.role as Rol),
      }));
    },
  });
}

export function useGuardarPerfil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: Partial<Pick<Usuario, "nombre" | "telefono" | "correo" | "relacion" | "activo" | "aprobado">>;
    }) => {
      const { error } = await supabase.from("profiles").update(cambios).eq("id", id);
      if (error) throw error;
      void registrarAuditoria({
        tabla: "profiles",
        accion: "actualizar",
        registroId: id,
        campos: Object.keys(cambios),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      void qc.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
}

export function useAsignarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, rol }: { userId: string; rol: Rol }) => {
      const { error: errorBorrado } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (errorBorrado) throw errorBorrado;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: rol });
      if (error) throw error;
      void registrarAuditoria({
        tabla: "user_roles",
        accion: "actualizar",
        registroId: userId,
        campos: ["role"],
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["usuarios"] });
      void qc.invalidateQueries({ queryKey: ["rol"] });
    },
  });
}

export function useAuditoria(limite = 40) {
  return useQuery({
    queryKey: ["auditoria", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data ?? [];
    },
  });
}
