import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, Metrica } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConstantes, usePaciente } from "@/hooks/useCuidados";
import { fechaCorta, fechaHora, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/salud")({
  head: () => ({
    meta: [
      { title: "Constantes vitales · Centro de Cuidados" },
      {
        name: "description",
        content: "Presión arterial, peso, saturación, temperatura, balance de líquidos y síntomas diarios.",
      },
      { property: "og:title", content: "Constantes vitales" },
      { property: "og:description", content: "Evolución diaria de las constantes de la paciente." },
    ],
  }),
  component: Salud,
});

function Salud() {
  const { data: constantes } = useConstantes(90);
  const { data: paciente } = usePaciente();
  const ultima = constantes?.[0];

  const serie = [...(constantes ?? [])]
    .reverse()
    .map((c) => ({
      fecha: fechaCorta(c.medido_en),
      sistolica: c.presion_sistolica,
      diastolica: c.presion_diastolica,
      peso: c.peso,
      balance: (c.ingesta_liquidos_ml ?? 0) - (c.diuresis_ml ?? 0),
    }));

  return (
    <AppShell titulo="Constantes" descripcion="Evolución diaria y registro clínico">
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="Presión"
            valor={ultima ? `${ultima.presion_sistolica}/${ultima.presion_diastolica}` : "—"}
            unidad="mmHg"
          />
          <Metrica etiqueta="Pulso" valor={numero(ultima?.frecuencia_cardiaca)} unidad="lpm" />
          <Metrica etiqueta="Temperatura" valor={numero(ultima?.temperatura, 1)} unidad="°C" />
          <Metrica
            etiqueta="Peso"
            valor={numero(ultima?.peso, 1)}
            unidad="kg"
            ayuda={paciente?.peso_seco ? `Peso seco ${numero(paciente.peso_seco, 1)} kg` : undefined}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presión arterial (últimos 90 días)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {!constantes ? (
              <CargandoBloque filas={2} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} interval={12} />
                  <YAxis tick={{ fontSize: 11 }} domain={[50, 170]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sistolica"
                    name="Sistólica"
                    stroke="var(--chart-1)"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolica"
                    name="Diastólica"
                    stroke="var(--chart-2)"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {!constantes ? (
              <CargandoBloque />
            ) : (
              <ul className="space-y-3">
                {constantes.slice(0, 15).map((c) => (
                  <li key={c.id} className="rounded-xl border border-border p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular">
                          {c.presion_sistolica}/{c.presion_diastolica} mmHg · {c.frecuencia_cardiaca} lpm ·{" "}
                          {numero(c.saturacion)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fechaHora(c.medido_en)} · {numero(c.peso, 1)} kg · {numero(c.temperatura, 1)} °C
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ingesta {numero(c.ingesta_liquidos_ml)} mL · Diuresis {numero(c.diuresis_ml)} mL ·
                          Edema: {c.edema ?? "—"}
                        </p>
                        {c.observaciones ? <p className="mt-1 text-xs">{c.observaciones}</p> : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {(c.sintomas ?? []).map((s) => (
                          <Badge key={s} variant="outline" className="text-[0.65rem]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
