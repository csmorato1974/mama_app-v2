import { describe, expect, it } from "vitest";

import { costeEstimado, errorSeguro, evaluarLimites, modeloConfigurado } from "./openai.server";

const base = {
  ia_activa: true,
  modelo: "gpt-4o-mini",
  limite_diario_usuario: 5,
  limite_mensual_usuario: 50,
  limite_diario_global: 10,
  limite_mensual_global: 100,
};

const sinUso = { diaUsuario: 0, mesUsuario: 0, diaGlobal: 0, mesGlobal: 0 };

describe("modelo configurable", () => {
  it("usa gpt-4o-mini por defecto", () => {
    expect(modeloConfigurado(null)).toBe("gpt-4o-mini");
  });

  it("respeta el modelo guardado en la configuración", () => {
    expect(modeloConfigurado({ modelo: "gpt-4o" })).toBe("gpt-4o");
  });
});

describe("límites de uso", () => {
  it("permite cuando hay margen", () => {
    expect(evaluarLimites(base, sinUso).permitido).toBe(true);
  });

  it("bloquea con mensaje claro al alcanzar el límite diario del usuario", () => {
    const r = evaluarLimites(base, { ...sinUso, diaUsuario: 5 });
    expect(r.permitido).toBe(false);
    expect(r.permitido === false && r.motivo).toContain("límite diario");
  });

  it("bloquea al alcanzar el límite global mensual", () => {
    const r = evaluarLimites(base, { ...sinUso, mesGlobal: 100 });
    expect(r.permitido === false && r.motivo).toContain("global");
  });

  it("bloquea si un administrador desactivó la IA", () => {
    const r = evaluarLimites({ ...base, ia_activa: false }, sinUso);
    expect(r.permitido).toBe(false);
  });
});

describe("seguridad de la clave", () => {
  it("nunca propaga la clave en los mensajes de error", () => {
    const codigo = errorSeguro(new Error("Invalid api key sk-proj-ABCDEFGHIJK1234567890"));
    expect(codigo).not.toContain("sk-proj");
    expect(codigo).toContain("[clave]");
  });

  it("estima el coste en USD por tokens", () => {
    expect(costeEstimado("gpt-4o-mini", 1_000_000, 0)).toBeCloseTo(0.15, 4);
  });
});
