// Orquestación de las llamadas de IA de producción: rol, límites, contexto
// mínimo, llamada a OpenAI y registro de consumo en ai_usage_log.
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import {
  claveConfigurada,
  costeEstimado,
  errorSeguro,
  evaluarLimites,
  llamarOpenAI,
  modeloConfigurado,
  type ConfigIA,
  type FuncionIA,
} from "./openai.server";

type Cliente = SupabaseClient<Database>;

const ROLES_IA = ["administrador", "familiar", "enfermeria", "medico"];

export async function rolesDeUsuario(cliente: Cliente, userId: string): Promise<string[]> {
  const { data, error } = await cliente.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error("sin_permisos");
  return (data ?? []).map((r) => String(r.role));
}

export async function leerConfig(): Promise<ConfigIA> {
  const { data } = await supabaseAdmin
    .from("ai_config")
    .select(
      "ia_activa, modelo, limite_diario_usuario, limite_mensual_usuario, limite_diario_global, limite_mensual_global",
    )
    .maybeSingle();

  return {
    ia_activa: data?.ia_activa ?? true,
    modelo: modeloConfigurado(data),
    limite_diario_usuario: data?.limite_diario_usuario ?? 40,
    limite_mensual_usuario: data?.limite_mensual_usuario ?? 400,
    limite_diario_global: data?.limite_diario_global ?? 150,
    limite_mensual_global: data?.limite_mensual_global ?? 2000,
  };
}

function desde(dias: "dia" | "mes"): string {
  const ahora = new Date();
  if (dias === "dia") return new Date(ahora.toISOString().slice(0, 10)).toISOString();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString();
}

async function contar(filtro: { usuario?: string; desde: string }): Promise<number> {
  let consulta = supabaseAdmin
    .from("ai_usage_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", filtro.desde)
    .eq("estado", "ok");
  if (filtro.usuario) consulta = consulta.eq("usuario_id", filtro.usuario);
  const { count } = await consulta;
  return count ?? 0;
}

export async function consumo(userId: string) {
  const [diaUsuario, mesUsuario, diaGlobal, mesGlobal] = await Promise.all([
    contar({ usuario: userId, desde: desde("dia") }),
    contar({ usuario: userId, desde: desde("mes") }),
    contar({ desde: desde("dia") }),
    contar({ desde: desde("mes") }),
  ]);
  return { diaUsuario, mesUsuario, diaGlobal, mesGlobal };
}

export async function costeDelMes(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("ai_usage_log")
    .select("coste_estimado_usd")
    .gte("created_at", desde("mes"));
  return Number(
    (data ?? []).reduce((total, fila) => total + Number(fila.coste_estimado_usd ?? 0), 0).toFixed(4),
  );
}

async function registrar(fila: {
  usuario_id: string;
  paciente_id: string | null;
  funcion: FuncionIA;
  modelo: string;
  tokens_entrada: number;
  tokens_salida: number;
  latencia_ms: number;
  estado: string;
  error_codigo?: string | null;
  request_id?: string | null;
}) {
  await supabaseAdmin.from("ai_usage_log").insert({
    ...fila,
    tokens_total: fila.tokens_entrada + fila.tokens_salida,
    coste_estimado_usd: costeEstimado(fila.modelo, fila.tokens_entrada, fila.tokens_salida),
  });
}

export class ErrorIA extends Error {}

/** Contexto mínimo y estructurado del paciente autorizado (RLS del usuario). */
export async function contextoPaciente(cliente: Cliente, pacienteId: string): Promise<string> {
  const { data: paciente, error } = await cliente
    .from("pacientes")
    .select("id, nombre, diagnostico_principal, modalidad_dialisis, peso_seco, alergias")
    .eq("id", pacienteId)
    .maybeSingle();

  if (error) throw new ErrorIA("No tienes acceso a los datos de este paciente.");
  if (!paciente) throw new ErrorIA("Paciente no encontrado o sin autorización de acceso.");

  const [constantes, sesiones, medicacion, laboratorio, inventario] = await Promise.all([
    cliente
      .from("constantes")
      .select(
        "medido_en, presion_sistolica, presion_diastolica, frecuencia_cardiaca, saturacion, peso, diuresis_ml, ingesta_liquidos_ml",
      )
      .order("medido_en", { ascending: false })
      .limit(14),
    cliente
      .from("sesiones_dialisis")
      .select("fecha, ultrafiltracion_ml, volumen_drenado_ml, aspecto_liquido, incidencias")
      .order("fecha", { ascending: false })
      .limit(10),
    cliente.from("medicamentos").select("nombre, dosis, frecuencia").eq("estado", "activo").limit(25),
    cliente
      .from("resultados_laboratorio")
      .select("fecha, parametro, valor, unidad")
      .eq("fuera_de_rango", true)
      .order("fecha", { ascending: false })
      .limit(12),
    cliente
      .from("inventario")
      .select("producto, cantidad_disponible, stock_minimo, proxima_entrega")
      .limit(10),
  ]);

  const lineas = [
    `PACIENTE: ${paciente.nombre} · ${paciente.diagnostico_principal ?? "sin diagnóstico registrado"} · ${paciente.modalidad_dialisis ?? "modalidad no registrada"} · peso seco ${paciente.peso_seco ?? "no registrado"} kg · alergias ${paciente.alergias ?? "no registradas"}`,
    "CONSTANTES (más recientes primero):",
    ...(constantes.data ?? []).map(
      (c) =>
        `- ${c.medido_en}: PA ${c.presion_sistolica ?? "—"}/${c.presion_diastolica ?? "—"} mmHg, FC ${c.frecuencia_cardiaca ?? "—"}, SpO2 ${c.saturacion ?? "—"}%, peso ${c.peso ?? "—"} kg, diuresis ${c.diuresis_ml ?? "—"} ml, ingesta ${c.ingesta_liquidos_ml ?? "—"} ml`,
    ),
    "DIÁLISIS PERITONEAL:",
    ...(sesiones.data ?? []).map(
      (s) =>
        `- ${s.fecha}: UF ${s.ultrafiltracion_ml ?? "—"} ml, drenado ${s.volumen_drenado_ml ?? "—"} ml, aspecto ${s.aspecto_liquido ?? "—"}, incidencias ${s.incidencias ?? "ninguna"}`,
    ),
    "MEDICACIÓN ACTIVA:",
    ...(medicacion.data ?? []).map((m) => `- ${m.nombre} ${m.dosis ?? ""} ${m.frecuencia ?? ""}`.trim()),
    "LABORATORIO FUERA DE RANGO:",
    ...(laboratorio.data ?? []).map(
      (r) => `- ${r.fecha} ${r.parametro}: ${r.valor ?? "—"} ${r.unidad ?? ""}`.trim(),
    ),
    "INVENTARIO:",
    ...(inventario.data ?? []).map(
      (i) =>
        `- ${i.producto}: ${i.cantidad_disponible} disponibles (mínimo ${i.stock_minimo ?? "—"}), próxima entrega ${i.proxima_entrega ?? "—"}`,
    ),
  ];

  // Límite duro de contexto para controlar coste.
  return lineas.join("\n").slice(0, 9000);
}

export const INSTRUCCIONES_CHAT = [
  "Eres un asistente clínico de apoyo para la familia y el equipo que cuida a una paciente mayor con enfermedad renal crónica en diálisis peritoneal.",
  "Responde en español, con frases breves, tono sobrio y sin alarmismo. Usa unidades métricas y bolivianos (Bs).",
  "NO inventes datos: usa exclusivamente los datos registrados que se te entregan.",
  "No sustituyes al equipo médico: no prescribes ni cambias tratamientos.",
  "Responde SIEMPRE con estas tres secciones en markdown y en este orden:",
  "## DATOS REGISTRADOS",
  "## INTERPRETACIÓN",
  "## DATOS FALTANTES",
  "En DATOS REGISTRADOS cita solo cifras presentes en el contexto. En DATOS FALTANTES enumera qué haría falta registrar para responder mejor.",
].join("\n");

/** Ejecuta una función de IA con verificación de rol, límites y registro de consumo. */
export async function ejecutarIA(opciones: {
  cliente: Cliente;
  userId: string;
  funcion: FuncionIA;
  pacienteId: string | null;
  instrucciones: string;
  entrada: string;
  maxTokens?: number;
}): Promise<{ texto: string; modelo: string; tokens: number; requestId: string | null }> {
  if (!claveConfigurada()) {
    throw new ErrorIA(
      "Configuración pendiente: falta el secreto OPENAI_API_KEY. Un administrador debe añadirlo para activar la IA.",
    );
  }

  const roles = await rolesDeUsuario(opciones.cliente, opciones.userId);
  if (!roles.some((r) => ROLES_IA.includes(r))) {
    throw new ErrorIA("Tu rol no tiene permiso para usar la IA.");
  }

  const config = await leerConfig();
  const limite = evaluarLimites(config, await consumo(opciones.userId));
  if (!limite.permitido) throw new ErrorIA(limite.motivo);

  try {
    const respuesta = await llamarOpenAI({
      modelo: config.modelo,
      instrucciones: opciones.instrucciones,
      entrada: opciones.entrada,
      maxTokens: opciones.maxTokens,
    });

    await registrar({
      usuario_id: opciones.userId,
      paciente_id: opciones.pacienteId,
      funcion: opciones.funcion,
      modelo: config.modelo,
      tokens_entrada: respuesta.tokensEntrada,
      tokens_salida: respuesta.tokensSalida,
      latencia_ms: respuesta.latenciaMs,
      estado: "ok",
      request_id: respuesta.requestId,
    });

    return {
      texto: respuesta.texto,
      modelo: config.modelo,
      tokens: respuesta.tokensEntrada + respuesta.tokensSalida,
      requestId: respuesta.requestId,
    };
  } catch (error) {
    const codigo = errorSeguro(error);
    console.error(`[IA] ${opciones.funcion} falló: ${codigo}`);
    await registrar({
      usuario_id: opciones.userId,
      paciente_id: opciones.pacienteId,
      funcion: opciones.funcion,
      modelo: config.modelo,
      tokens_entrada: 0,
      tokens_salida: 0,
      latencia_ms: 0,
      estado: "error",
      error_codigo: codigo,
    });
    throw new ErrorIA("El servicio de IA no pudo responder. Inténtalo de nuevo en unos minutos.");
  }
}
