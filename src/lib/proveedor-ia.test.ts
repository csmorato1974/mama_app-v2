import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PROVEEDORES } from "./openai.server";

/** Archivos de la app (excluye integraciones generadas y esta prueba). */
function archivos(dir: string, salida: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) {
      if (entrada === "integrations") continue;
      archivos(ruta, salida);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entrada) && !entrada.endsWith(".test.ts")) salida.push(ruta);
  }
  return salida;
}

const PROHIBIDO = [
  "ai.gateway.lovable.dev",
  "LOVABLE_API_KEY",
  "@ai-sdk/openai-compatible",
  "createLovableAiGatewayProvider",
];

describe("producción sin proveedores de Lovable", () => {
  it("ninguna función runtime referencia Lovable AI", () => {
    const infracciones: string[] = [];
    for (const ruta of archivos("src")) {
      const contenido = readFileSync(ruta, "utf8");
      for (const patron of PROHIBIDO) {
        if (contenido.includes(patron)) infracciones.push(`${ruta} → ${patron}`);
      }
    }
    expect(infracciones).toEqual([]);
  });

  it("cada función de IA declara OpenAI como proveedor", () => {
    expect(PROVEEDORES.map((p) => p.funcion).sort()).toEqual(["assistant-chat", "informe", "ocr", "voz"]);
    for (const p of PROVEEDORES) {
      expect(p.proveedor).toMatch(/^OpenAI/);
      expect(p.proveedor.toLowerCase()).not.toContain("lovable");
      expect(p.proveedor.toLowerCase()).not.toContain("gemini");
    }
  });

  it("no existe la antigua capa del gateway de Lovable", () => {
    expect(() => readFileSync("src/lib/ia.server.ts", "utf8")).toThrow();
  });
});
