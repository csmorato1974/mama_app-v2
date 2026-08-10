const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODELO = "google/gemini-3.6-flash";

function clave(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta LOVABLE_API_KEY");
  return key;
}

type Bloque =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function chatIA(opciones: {
  system: string;
  contenido: string | Bloque[];
  json?: boolean;
}): Promise<string> {
  const respuesta = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clave()}`,
    },
    body: JSON.stringify({
      model: MODELO,
      messages: [
        { role: "system", content: opciones.system },
        { role: "user", content: opciones.contenido },
      ],
      ...(opciones.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(`La IA no pudo responder [${respuesta.status}]: ${detalle}`);
  }

  const datos = (await respuesta.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return datos.choices?.[0]?.message?.content ?? "";
}

export function extraerJson<T>(texto: string): T {
  const limpio = texto
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  const candidato = inicio >= 0 && fin > inicio ? limpio.slice(inicio, fin + 1) : limpio;
  return JSON.parse(candidato) as T;
}

export async function transcribir(base64: string, mime: string): Promise<string> {
  const binario = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const extension =
    mime.includes("wav") ? "wav" : mime.includes("mp4") ? "mp4" : mime.includes("mpeg") ? "mp3" : "webm";

  const formulario = new FormData();
  formulario.append("model", "openai/gpt-4o-mini-transcribe");
  formulario.append("file", new Blob([binario], { type: mime }), `nota.${extension}`);

  const respuesta = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${clave()}` },
    body: formulario,
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(`No se pudo transcribir el audio [${respuesta.status}]: ${detalle}`);
  }

  const datos = (await respuesta.json()) as { text?: string };
  return datos.text ?? "";
}
