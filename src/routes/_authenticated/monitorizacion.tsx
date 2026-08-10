import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { EtiquetaSeveridad, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertas } from "@/hooks/useAlertas";
import { useConstantes, useReglasAlerta } from "@/hooks/useCuidados";
import { fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/monitorizacion")({
  head: () => ({
    meta: [
      { title: "Monitorización continua · Centro de Cuidados" },
      {
        name: "description",
        content: "Tendencias de constantes, umbrales de vigilancia y alertas activas del plan de cuidados.",
      },
      { property: "og:title", content: "Monitorización continua" },
      { property: "og:description", content: "Umbrales, tendencias y alertas del seguimiento diario." },
    ],
  }),
  component: Monitorizacion,
});

function Monitorizacion() {
  const { data: constantes } = useConstantes(45);
  const { data: reglas } = useReglasAlerta();
  const { data: alertas } = useAlertas();

  const serie = [...(constantes ?? [])]
    .reverse()
    .map((c) => ({
      fecha: fechaCorta(c.medido_en),
      peso: c.peso,
      saturacion: c.saturacion,
      pulso: c.frecuencia_cardiaca,
    }));

  return (
    <AppShell titulo="Monitorización continua" descripcion="Tendencias, umbrales y alertas">
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Reglas activas" valor={(reglas ?? []).filter((r) => r.activa).length} />
          <Metrica
            etiqueta="Alertas activas"
            valor={alertas?.length ?? 0}
            estado={(alertas?.length ?? 0) > 0 ? "atencion" : "bien"}
          />
          <Metrica
            etiqueta="Alertas altas"
            valor={(alertas ?? []).filter((a) => a.severidad === "alta").length}
            estado={(alertas ?? []).some((a) => a.severidad === "alta") ? "riesgo" : "bien"}
          />
          <Metrica etiqueta="Registros 45 días" valor={constantes?.length ?? 0} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peso, saturación y pulso</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {serie.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip />
                  <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="var(--color-primary)" dot={false} />
                  <Line
                    type="monotone"
                    dataKey="saturacion"
                    name="SpO₂ (%)"
                    stroke="var(--color-success)"
                    dot={false}
                  />
                  <Line type="monotone" dataKey="pulso" name="Pulso (lpm)" stroke="var(--color-warning)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <SeccionVacia mensaje="Sin datos de constantes." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alertas activas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alertas?.length ? (
                alertas.map((a, i) => (
                  <div
                    key={`${a.titulo}-${i}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.titulo}</p>
                      <p className="text-xs text-muted-foreground">{a.detalle}</p>
                    </div>
                    <EtiquetaSeveridad severidad={a.severidad} />
                  </div>
                ))
              ) : (
                <SeccionVacia mensaje="Sin alertas activas ahora mismo." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Umbrales configurados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(reglas ?? []).map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/70 py-2 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.ambito} · {r.campo}
                      {r.valor_min != null ? ` · mín ${numero(r.valor_min, 1)}` : ""}
                      {r.valor_max != null ? ` · máx ${numero(r.valor_max, 1)}` : ""}
                    </p>
                  </div>
                  <EtiquetaSeveridad severidad={r.severidad} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
