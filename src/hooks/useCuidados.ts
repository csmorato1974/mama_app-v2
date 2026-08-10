import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const PACIENTE_ID = "11111111-1111-1111-1111-111111111111";

export function usePaciente() {
  return useQuery({
    queryKey: ["paciente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", PACIENTE_ID)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useConstantes(limite = 60) {
  return useQuery({
    queryKey: ["constantes", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("constantes")
        .select("*")
        .order("medido_en", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSesionesDialisis(limite = 60) {
  return useQuery({
    queryKey: ["sesiones_dialisis", limite],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sesiones_dialisis")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(limite);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActividades() {
  return useQuery({
    queryKey: ["actividades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actividades")
        .select("*, contacto:contactos(nombre, especialidad, telefono)")
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMedicamentos() {
  return useQuery({
    queryKey: ["medicamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicamentos")
        .select("*, prescriptor:contactos(nombre, especialidad)")
        .order("estado", { ascending: true })
        .order("nombre", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdministraciones(desde: string) {
  return useQuery({
    queryKey: ["administraciones", desde],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("administraciones")
        .select("*")
        .gte("administrado_en", desde)
        .order("administrado_en", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useContactos() {
  return useQuery({
    queryKey: ["contactos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contactos")
        .select("*")
        .order("categoria", { ascending: true })
        .order("nombre", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDocumentos() {
  return useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("*, profesional:contactos(nombre, especialidad)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLaboratorio() {
  return useQuery({
    queryKey: ["resultados_laboratorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resultados_laboratorio")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInventario() {
  return useQuery({
    queryKey: ["inventario"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario")
        .select("*")
        .order("categoria", { ascending: true })
        .order("producto", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGastos() {
  return useQuery({
    queryKey: ["gastos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEventosClinicos() {
  return useQuery({
    queryKey: ["eventos_clinicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos_clinicos")
        .select("*, profesional:contactos(nombre, especialidad)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReglasAlerta() {
  return useQuery({
    queryKey: ["reglas_alerta"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reglas_alerta")
        .select("*")
        .order("ambito", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
