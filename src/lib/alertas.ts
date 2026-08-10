import type { Tables } from "@/integrations/supabase/types";
import { differenceInCalendarDays } from "date-fns";

import { toDate } from "@/lib/format";

export type Severidad = "alta" | "media" | "baja";

export type Alerta = {
  id: string;
  severidad: Severidad;
  ambito: "constantes" | "dialisis" | "laboratorio" | "inventario" | "agenda" | "medicacion";
  titulo: string;
  detalle: string;
  ruta: string;
};

type Regla = Tables<"reglas_alerta">;

function evaluar(regla: Regla, valor: number | null | undefined): boolean {
  if (valor === null || valor === undefined) return false;
  switch (regla.operador) {
    case "mayor_que":
      return regla.valor_max !== null && valor > regla.valor_max;
    case "menor_que":
      return regla.valor_min !== null ? valor < regla.valor_min : false;
    case "fuera_rango":
      return (
        (regla.valor_min !== null && valor < regla.valor_min) ||
        (regla.valor_max !== null && valor > regla.valor_max)
      );
    default:
      return false;
  }
}

export function calcularAlertas(input: {
  reglas: Regla[];
  constantes: Tables<"constantes">[];
  sesiones: Tables<"sesiones_dialisis">[];
  laboratorio: Tables<"resultados_laboratorio">[];
  inventario: Tables<"inventario">[];
  actividades: Tables<"actividades">[];
}): Alerta[] {
  const { reglas, constantes, sesiones, laboratorio, inventario, actividades } = input;
  const activas = reglas.filter((r) => r.activa);
  const alertas: Alerta[] = [];

  const ultima = constantes[0];
  if (ultima) {
    for (const regla of activas.filter((r) => r.ambito === "constantes")) {
      const valor = (ultima as unknown as Record<string, number | null>)[regla.campo];
      if (evaluar(regla, valor)) {
        alertas.push({
          id: `constantes-${regla.id}`,
          severidad: regla.severidad as Severidad,
          ambito: "constantes",
          titulo: regla.nombre,
          detalle: `${regla.mensaje ?? ""} Último valor registrado: ${valor}.`.trim(),
          ruta: "/salud",
        });
      }
    }
  }

  const ultimaSesion = sesiones[0];
  if (ultimaSesion) {
    for (const regla of activas.filter((r) => r.ambito === "dialisis")) {
      const valor = (ultimaSesion as unknown as Record<string, number | null>)[regla.campo];
      if (evaluar(regla, valor)) {
        alertas.push({
          id: `dialisis-${regla.id}`,
          severidad: regla.severidad as Severidad,
          ambito: "dialisis",
          titulo: regla.nombre,
          detalle: `${regla.mensaje ?? ""} Última sesión: ${valor} mL.`.trim(),
          ruta: "/dialisis",
        });
      }
    }
  }

  const ultimoPorParametro = new Map<string, Tables<"resultados_laboratorio">>();
  for (const r of laboratorio) {
    if (!ultimoPorParametro.has(r.parametro)) ultimoPorParametro.set(r.parametro, r);
  }
  for (const regla of activas.filter((r) => r.ambito === "laboratorio")) {
    const resultado = ultimoPorParametro.get(regla.campo);
    if (resultado && evaluar(regla, resultado.valor)) {
      alertas.push({
        id: `lab-${regla.id}`,
        severidad: regla.severidad as Severidad,
        ambito: "laboratorio",
        titulo: `${regla.nombre}`,
        detalle: `${regla.mensaje ?? ""} ${resultado.parametro}: ${resultado.valor} ${resultado.unidad ?? ""}.`.trim(),
        ruta: "/analiticas",
      });
    }
  }

  for (const item of inventario) {
    if (item.stock_minimo !== null && item.cantidad_disponible <= item.stock_minimo) {
      alertas.push({
        id: `stock-${item.id}`,
        severidad: "alta",
        ambito: "inventario",
        titulo: `Stock bajo: ${item.producto}`,
        detalle: `Quedan ${item.cantidad_disponible} unidades (mínimo ${item.stock_minimo}).`,
        ruta: "/inventario",
      });
    }
    const dias = item.caducidad ? differenceInCalendarDays(toDate(item.caducidad)!, new Date()) : null;
    if (dias !== null && dias <= 60) {
      alertas.push({
        id: `caducidad-${item.id}`,
        severidad: dias <= 30 ? "alta" : "media",
        ambito: "inventario",
        titulo: `Próximo a caducar: ${item.producto}`,
        detalle: dias >= 0 ? `Caduca en ${dias} días.` : `Caducó hace ${Math.abs(dias)} días.`,
        ruta: "/inventario",
      });
    }
  }

  for (const act of actividades) {
    const dias = differenceInCalendarDays(toDate(act.fecha)!, new Date());
    if (act.estado === "pendiente" && dias < 0) {
      alertas.push({
        id: `agenda-${act.id}`,
        severidad: "media",
        ambito: "agenda",
        titulo: `Pendiente vencido: ${act.titulo}`,
        detalle: `Estaba previsto hace ${Math.abs(dias)} días.`,
        ruta: "/agenda",
      });
    }
  }

  const orden: Record<Severidad, number> = { alta: 0, media: 1, baja: 2 };
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}
