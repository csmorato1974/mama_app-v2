import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { FilaDato, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConstantes } from "@/hooks/useCuidados";
import { fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/nutricion")({
  head: () => ({
    meta: [
      { title: "Nutrición e hidratación · Centro de Cuidados" },
      {
        name: "description",
        content: "Restricción hídrica, pautas de potasio, fósforo, sodio y proteínas para diálisis peritoneal.",
      },
      { property: "og:title", content: "Nutrición e hidratación" },
      { property: "og:description", content: "Pautas dietéticas y balance de líquidos diario." },
    ],
  }),
  component: Nutricion,
});

const PAUTAS = [
  { etiqueta: "Líquidos", valor: "1.000 ml/día + diuresis" },
  { etiqueta: "Sodio", valor: "< 2.000 mg/día (sin sal añadida)" },
  { etiqueta: "Potasio", valor: "2.000–2.500 mg/día" },
  { etiqueta: "Fósforo", valor: "800–1.000 mg/día con quelante" },
  { etiqueta: "Proteínas", valor: "1,2 g/kg/día (≈ 70 g)" },
  { etiqueta: "Energía", valor: "30–35 kcal/kg/día" },
];

const ALIMENTOS = [
  { grupo: "Recomendados", items: "Arroz, fideo, pan blanco, manzana, pera, papaya, clara de huevo, pollo, pescado" },
  { grupo: "Con moderación", items: "Leche, yogur, queso fresco, plátano maduro, cítricos, tomate" },
  { grupo: "Evitar", items: "Caldos concentrados, embutidos, enlatados, chuño remojado sin cambio de agua, gaseosas de cola, frutos secos" },
];

function Nutricion() {
  const { data: constantes } = useConstantes(30);
  const ultima = constantes?.[0];

  const serie = [...(constantes ?? [])]
    .reverse()
    .map((c) => ({
      fecha: fechaCorta(c.medido_en),
      ingesta: c.ingesta_liquidos_ml ?? 0,
      diuresis: c.diuresis_ml ?? 0,
    }));

  const balance = (ultima?.ingesta_liquidos_ml ?? 0) - (ultima?.diuresis_ml ?? 0);

  return (
    <AppShell titulo="Nutrición e hidratación" descripcion="Pautas renales y balance de líquidos">
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="Ingesta hoy"
            valor={numero(ultima?.ingesta_liquidos_ml)}
            unidad="ml"
            ayuda="Límite orientativo 1.000 ml"
            estado={(ultima?.ingesta_liquidos_ml ?? 0) > 1200 ? "atencion" : "bien"}
          />
          <Metrica etiqueta="Diuresis" valor={numero(ultima?.diuresis_ml)} unidad="ml" />
          <Metrica
            etiqueta="Balance"
            valor={numero(balance)}
            unidad="ml"
            estado={balance > 600 ? "riesgo" : balance > 300 ? "atencion" : "bien"}
          />
          <Metrica etiqueta="Apetito" valor={ultima?.apetito ?? "—"} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingesta y diuresis (30 días)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {serie.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={(v: number) => `${numero(v)} ml`} />
                  <Area
                    type="monotone"
                    dataKey="ingesta"
                    name="Ingesta"
                    stroke="var(--color-primary)"
                    fill="var(--color-primary)"
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="diuresis"
                    name="Diuresis"
                    stroke="var(--color-accent-foreground)"
                    fill="var(--color-accent-foreground)"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <SeccionVacia mensaje="Sin registros de líquidos." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pauta dietética renal</CardTitle>
            </CardHeader>
            <CardContent>
              {PAUTAS.map((p) => (
                <FilaDato key={p.etiqueta} etiqueta={p.etiqueta} valor={p.valor} />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ALIMENTOS.map((a) => (
                <div key={a.grupo}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{a.grupo}</p>
                  <p className="mt-1 text-sm">{a.items}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
