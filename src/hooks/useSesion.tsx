import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

export type Rol = "administrador" | "familiar" | "enfermeria" | "medico" | "lectura";

type SesionContexto = {
  session: Session | null;
  user: User | null;
  cargando: boolean;
};

const Ctx = createContext<SesionContexto>({ session: null, user: null, cargando: true });

export function SesionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nuevaSesion) => {
      setSession(nuevaSesion);
      setCargando(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
      }
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, cargando }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSesion() {
  return useContext(Ctx);
}

export function useRol() {
  const { user } = useSesion();

  const { data } = useQuery({
    queryKey: ["rol", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as Rol);
    },
  });

  const roles = data ?? [];
  const rol: Rol = roles[0] ?? "lectura";

  return {
    roles,
    rol,
    puedeEditar: roles.some((r) => ["administrador", "familiar", "enfermeria", "medico"].includes(r)),
    esAdmin: roles.includes("administrador"),
  };
}

export function usePerfil() {
  const { user } = useSesion();
  return useQuery({
    queryKey: ["perfil", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
