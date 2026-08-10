import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EntradaChat = z.object({
  mensaje: z.string().min(2).max(1000),
  patient_id: z.string().uuid(),
});

const EntradaConfig = z.object({
  ia_activa: z.boolean().optional(),
  modelo: z.string().min(2).max(60).optional(),
  limite_diario_usuario: z.number().int().min(0).max(1000).optional(),
  limite_mensual_usuario: z.number().int().min(0).max(20000).optional(),
  limite_diario_global: z.number().int().min(0).max(5000).optional(),
  limite_mensual_global: z.number().int().min(0).max(100000).optional(),
});

/** Endpoint assistant-chat: mensaje + patient_id, contexto limitado y respuesta estructurada. */
export const assistantChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => EntradaChat.parse(entrada))
  .handler(async ({ data, context }) => {
    const { contextoPaciente, ejecutarIA, ErrorIA, INSTRUCCIONES_CHAT } = await import("./ia-openai.server");

    try {
      const contexto = await contextoPaciente(context.supabase, data.patient_id);
      const resultado = await ejecutarIA({
        cliente: context.supabase,
        userId: context.userId,
        funcion: "assistant-chat",
        pacienteId: data.patient_id,
        instrucciones: INSTRUCCIONES_CHAT,
        entrada: `PREGUNTA: ${data.mensaje}\n\nDATOS REGISTRADOS DEL PACIENTE:\n${contexto}`,
      });
      return { ok: true as const, ...resultado };
    } catch (error) {
      if (error instanceof ErrorIA) return { ok: false as const, mensaje: error.message };
      throw error;
    }
  });

/** Estado de configuración, modelo y consumo aproximado para la interfaz. */
export const estadoIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { consumo, costeDelMes, leerConfig, rolesDeUsuario } = await import("./ia-openai.server");
    const { claveConfigurada } = await import("./openai.server");

    const roles = await rolesDeUsuario(context.supabase, context.userId);
    const config = await leerConfig();

    return {
      configurada: claveConfigurada(),
      proveedor: "OpenAI (API propia)",
      roles,
      config,
      consumo: await consumo(context.userId),
      coste_mes_usd: await costeDelMes(),
    };
  });

/** Solo administradores: cambia modelo, límites o desactiva la IA. */
export const actualizarConfigIA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => EntradaConfig.parse(entrada))
  .handler(async ({ data, context }) => {
    const { leerConfig, rolesDeUsuario } = await import("./ia-openai.server");

    const roles = await rolesDeUsuario(context.supabase, context.userId);
    if (!roles.includes("administrador")) {
      return { ok: false as const, mensaje: "Solo un administrador puede cambiar la configuración de IA." };
    }

    const { error } = await context.supabase.from("ai_config").update(data).eq("id", true);
    if (error) return { ok: false as const, mensaje: "No se pudo guardar la configuración." };

    return { ok: true as const, config: await leerConfig() };
  });
