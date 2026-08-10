// Capa de servidor para la API propia de OpenAI (producción).
// La clave vive SOLO en el secreto de backend OPENAI_API_KEY: nunca se envía al
// navegador, no se guarda en tablas y no se registra en logs.
// Esta misma capa queda preparada para OCR y voz (ver ejecutarIA + FUNCIONES_IA).

const OPENAI_URL = "https://api.openai.com/v1/responses";
export const MODELO_POR_DEFECTO = "gpt-4o-mini";

// USD por 1M de tokens (aproximado, solo para estimar consumo).
const PRECIOS: Record<string, { entrada: number; salida: number }> = {
  "gpt-4o-mini": { entrada: 0.15, salida: 0.6 },
  "gpt-4o": { entrada: 2.5, salida: 10 },
  "gpt-4.1-mini": { entrada: 0.4, salida: 1.6 },
  "gpt-4.1": { entrada: 2, salida: 8 },
};

export type FuncionIA = "assistant-chat" | "informe" | "ocr" | "voz";

export type ConfigIA = {
  ia_activa: boolean;
  modelo: string;
  limite_diario_usuario: number;
  limite_mensual_usuario: number;
  limite_diario_global: number;
  limite_mensual_global: number;
};

export function claveConfigurada(): boolean {
  return Boolean(process.env["OPENAI_API_KEY"]);
}

export function modeloConfigurado(config?: Pick<ConfigIA, "modelo"> | null): string {
  return config?.modelo?.trim() || process.env["OPENAI_MODEL"]?.trim() || MODELO_POR_DEFECTO;
}

export function costeEstimado(modelo: string, entrada: number, salida: number): number {
  const precio = PRECIOS[modelo] ?? PRECIOS[MODELO_POR_DEFECTO]!;
  return Number(((entrada * precio.entrada + salida * precio.salida) / 1_000_000).toFixed(6));
}

export type ResultadoLimite =
  | { permitido: true }
  | { permitido: false; motivo: string };

export function evaluarLimites(
  config: ConfigIA,
  uso: { diaUsuario: number; mesUsuario: number; diaGlobal: number; mesGlobal: number },
): ResultadoLimite {
  if (!config.ia_activa) {
    return { permitido: false, motivo: "La IA está desactivada por un administrador." };
  }
  if (uso.diaUsuario >= config.limite_diario_usuario) {
    return {
      permitido: false,
      motivo: `Has alcanzado tu límite diario de ${config.limite_diario_usuario} consultas de IA. Vuelve a intentarlo mañana.`,
    };
  }
  if (uso.mesUsuario >= config.limite_mensual_usuario) {
    return {
      permitido: false,
      motivo: `Has alcanzado tu límite mensual de ${config.limite_mensual_usuario} consultas de IA.`,
    };
  }
  if (uso.diaGlobal >= config.limite_diario_global) {
    return {
      permitido: false,
      motivo: `Se alcanzó el límite diario global de ${config.limite_diario_global} consultas de IA. Consulta con el administrador.`,
    };
  }
  if (uso.mesGlobal >= config.limite_mensual_global) {
    return {
      permitido: false,
      motivo: `Se alcanzó el límite mensual global de ${config.limite_mensual_global} consultas de IA. Consulta con el administrador.`,
    };
  }
  return { permitido: true };
}

// Solo un código corto y seguro: nunca claves ni contenido clínico.
export function errorSeguro(error: unknown): string {
  const texto = error instanceof Error ? error.message : "error_desconocido";
  return texto.replace(/sk-[A-Za-z0-9_-]+/g, "[clave]").slice(0, 180);
}

export type RespuestaOpenAI = {
  texto: string;
  tokensEntrada: number;
  tokensSalida: number;
  requestId: string | null;
  latenciaMs: number;
};

export type BloqueEntrada =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_file"; filename: string; file_data: string };

export async function llamarOpenAI(opciones: {
  modelo: string;
  instrucciones: string;
  entrada: string;
  bloques?: BloqueEntrada[];
  maxTokens?: number;
}): Promise<RespuestaOpenAI> {

  const clave = process.env["OPENAI_API_KEY"];
  if (!clave) throw new Error("configuracion_pendiente");

  const inicio = Date.now();
  const respuesta = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clave}`,
    },
    body: JSON.stringify({
      model: opciones.modelo,
      instructions: opciones.instrucciones,
      input: opciones.bloques
        ? [{ role: "user", content: opciones.bloques }]
        : opciones.entrada,

      max_output_tokens: opciones.maxTokens ?? 1200,
      store: false,
    }),
  });

  const requestId = respuesta.headers.get("x-request-id");

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(`openai_${respuesta.status}: ${detalle.slice(0, 120)}`);
  }

  const datos = (await respuesta.json()) as {
    output_text?: string;
    output?: { content?: { type?: string; text?: string }[] }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const texto =
    datos.output_text ??
    datos.output
      ?.flatMap((item) => item.content ?? [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text ?? "")
      .join("\n") ??
    "";

  return {
    texto,
    tokensEntrada: datos.usage?.input_tokens ?? 0,
    tokensSalida: datos.usage?.output_tokens ?? 0,
    requestId,
    latenciaMs: Date.now() - inicio,
  };
}
