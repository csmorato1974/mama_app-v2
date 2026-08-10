import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RegistroInterpretado = {
  modulo: "constantes" | "dialisis" | "medicacion" | "gasto" | "actividad" | "nota";
  resumen?: string;
  constantes?: {
    presion_sistolica?: number;
    presion_diastolica?: number;
    frecuencia_cardiaca?: number;
    saturacion?: number;
    temperatura?: number;
    peso?: number;
    glucemia?: number;
    ingesta_liquidos_ml?: number;
    diuresis_ml?: number;
    dolor?: number;
    edema?: string;
    apetito?: string;
    descanso?: string;
    sintomas?: string[];
    observaciones?: string;
  };
  dialisis?: {
    fecha?: string;
    concentracion?: string;
    numero_bolsas?: number;
    volumen_infundido_ml?: number;
    volumen_drenado_ml?: number;
    ultrafiltracion_ml?: number;
    aspecto_liquido?: string;
    incidencias?: string;
    observaciones?: string;
  };
  gasto?: {
    fecha?: string;
    categoria?: string;
    concepto?: string;
    proveedor?: string;
    importe?: number;
  };
  actividad?: {
    fecha?: string;
    hora?: string;
    tipo?: string;
    titulo?: string;
    lugar?: string;
    notas?: string;
  };
  nota?: {
    titulo?: string;
    descripcion?: string;
    categoria?: string;
    gravedad?: string;
  };
};

const EntradaVoz = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

const EntradaTexto = z.object({ texto: z.string().min(1) });

const EntradaDocumento = z.object({
  archivoBase64: z.string().min(1),
  mimeType: z.string().min(1),
  nombre: z.string().min(1),
});

const EntradaInforme = z.object({
  tipo: z.enum(["consulta", "semanal", "mensual"]),
  contexto: z.string().min(1),
});

export const transcribirNota = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => EntradaVoz.parse(entrada))
  .handler(async ({ data }) => {
    const { transcribir } = await import("./ia.server");
    const texto = await transcribir(data.audioBase64, data.mimeType);
    return { texto };
  });

export const interpretarRegistro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => EntradaTexto.parse(entrada))
  .handler(async ({ data }) => {
    const { chatIA, extraerJson } = await import("./ia.server");
    const hoy = new Date().toISOString().slice(0, 10);

    const respuesta = await chatIA({
      json: true,
      system: [
        "Eres un asistente clínico que convierte notas dictadas por cuidadores en registros estructurados.",
        "La paciente es una mujer mayor con enfermedad renal crónica en diálisis peritoneal (DPCA, 4 intercambios).",
        `La fecha de hoy es ${hoy}.`,
        "Devuelve SOLO un objeto JSON con esta forma:",
        '{"modulo":"constantes|dialisis|medicacion|gasto|actividad|nota","resumen":"frase breve en español",',
        '"constantes":{"presion_sistolica":num,"presion_diastolica":num,"frecuencia_cardiaca":num,"saturacion":num,',
        '"temperatura":num,"peso":num,"glucemia":num,"ingesta_liquidos_ml":num,"diuresis_ml":num,"dolor":num,',
        '"edema":"texto","apetito":"texto","descanso":"texto","sintomas":["texto"],"observaciones":"texto"},',
        '"dialisis":{"fecha":"YYYY-MM-DD","concentracion":"texto","numero_bolsas":num,"volumen_infundido_ml":num,',
        '"volumen_drenado_ml":num,"ultrafiltracion_ml":num,"aspecto_liquido":"claro|turbio|con fibrina",',
        '"incidencias":"texto","observaciones":"texto"},',
        '"gasto":{"fecha":"YYYY-MM-DD","categoria":"medicamentos|laboratorio|medicos|enfermeria|transporte|alimentacion|suministros|dialisis|tramites|otros","concepto":"texto","proveedor":"texto","importe":num},',
        '"actividad":{"fecha":"YYYY-MM-DD","hora":"HH:MM","tipo":"consulta|analitica|entrega_suministros|tramite|visita_enfermeria|otro","titulo":"texto","lugar":"texto","notas":"texto"},',
        '"nota":{"titulo":"texto","descripcion":"texto","categoria":"sintoma|incidencia_dp|consulta|otro","gravedad":"baja|media|alta"}}',
        "Incluye únicamente el bloque correspondiente al módulo elegido y omite los campos sin dato.",
        "Los importes están en bolivianos (Bs) y las unidades son métricas.",
      ].join("\n"),
      contenido: data.texto,
    });

    return extraerJson<RegistroInterpretado>(respuesta);
  });

export const leerDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => EntradaDocumento.parse(entrada))
  .handler(async ({ data }) => {
    const { chatIA, extraerJson } = await import("./ia.server");
    const dataUrl = `data:${data.mimeType};base64,${data.archivoBase64}`;

    const contenido = data.mimeType.startsWith("image/")
      ? ([
          { type: "text" as const, text: "Extrae la información de este documento clínico." },
          { type: "image_url" as const, image_url: { url: dataUrl } },
        ] as const)
      : ([
          { type: "text" as const, text: "Extrae la información de este documento clínico." },
          { type: "file" as const, file: { filename: data.nombre, file_data: dataUrl } },
        ] as const);

    const respuesta = await chatIA({
      json: true,
      system: [
        "Eres un asistente que digitaliza documentos clínicos de una paciente en diálisis peritoneal.",
        "Lee el documento y devuelve SOLO este objeto JSON:",
        '{"titulo":"texto","tipo":"resultado_laboratorio|receta|informe|epicrisis|imagen|administrativo",',
        '"fecha":"YYYY-MM-DD","institucion":"texto","resumen":"resumen clínico en 2 o 3 frases",',
        '"texto_ocr":"transcripción completa del documento",',
        '"resultados":[{"area":"renal|electrolitos|hematologia|metabolismo_mineral|pth|nutricion|hepatica|inflamacion|coagulacion|otros",',
        '"parametro":"texto","valor":num,"unidad":"texto","rango_min":num,"rango_max":num}]}',
        "Si no es una analítica, devuelve resultados como lista vacía. Responde en español.",
      ].join("\n"),
      contenido: [...contenido],
    });

    return extraerJson<{
      titulo: string;
      tipo: string;
      fecha: string;
      institucion?: string;
      resumen?: string;
      texto_ocr?: string;
      resultados?: {
        area: string;
        parametro: string;
        valor: number | null;
        unidad?: string;
        rango_min?: number | null;
        rango_max?: number | null;
      }[];
    }>(respuesta);
  });

// Informes: usa la API propia de OpenAI (producción) a través de la capa segura.
export const generarInforme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((entrada: unknown) => EntradaInforme.parse(entrada))
  .handler(async ({ data, context }) => {
    const { ejecutarIA, ErrorIA } = await import("./ia-openai.server");
    const enfoque =
      data.tipo === "consulta"
        ? "Informe de preparación para la próxima consulta de nefrología."
        : data.tipo === "semanal"
          ? "Resumen semanal del estado y del cuidado."
          : "Resumen mensual clínico y administrativo.";

    try {
      const resultado = await ejecutarIA({
        cliente: context.supabase,
        userId: context.userId,
        funcion: "informe",
        pacienteId: null,
        instrucciones: [
          "Eres un asistente clínico que redacta informes claros para el equipo médico y la familia.",
          "La paciente es una mujer mayor con enfermedad renal crónica estadio 5 en diálisis peritoneal continua ambulatoria.",
          `Tarea: ${enfoque}`,
          "Escribe en español, con encabezados en markdown y frases breves.",
          "Estructura: Situación general, Constantes y tendencias, Diálisis peritoneal, Medicación, Analíticas relevantes, Aspectos logísticos y económicos, Puntos a consultar con el equipo médico.",
          "No inventes datos: usa solo la información entregada e indica cuando falte información.",
          "Los importes están en bolivianos (Bs).",
        ].join("\n"),
        entrada: data.contexto.slice(0, 9000),
      });
      return { texto: resultado.texto };
    } catch (error) {
      if (error instanceof ErrorIA) return { texto: error.message };
      throw error;
    }
  });

