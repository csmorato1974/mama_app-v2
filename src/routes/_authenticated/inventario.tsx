import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, FilaDato, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useInventario } from "@/hooks/useCuidados";
import { capitalizar, fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario CNS · Centro de Cuidados" },
      {
        name: "description",
        content: "Control de suministros de diálisis peritoneal: stock disponible, lotes, caducidades y entregas.",
      },
      { property: "og:title", content: "Inventario CNS" },
      { property: "og:description", content: "Stock de suministros y próximas entregas." },
    ],
  }),
  component: Inventario,
});

function Inventario() {
  const { data: inventario, isLoading } = useInventario();

  const bajos = (inventario ?? []).filter(
    (i) => i.stock_minimo != null && i.cantidad_disponible <= i.stock_minimo,
  );
  const proximaEntrega = (inventario ?? [])
    .map((i) => i.proxima_entrega)
    .filter(Boolean)
    .sort()[0];

  return (
    <AppShell titulo="Inventario CNS" descripcion="Suministros, lotes y entregas">
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Referencias" valor={inventario?.length ?? 0} />
          <Metrica
            etiqueta="Bajo mínimo"
            valor={bajos.length}
            estado={bajos.length ? "riesgo" : "bien"}
            icono={bajos.length ? <AlertTriangle className="size-4" /> : undefined}
          />
          <Metrica etiqueta="Próxima entrega" valor={proximaEntrega ? fechaCorta(proximaEntrega) : "—"} />
          <Metrica
            etiqueta="Caducidad más próxima"
            valor={
              (inventario ?? [])
                .map((i) => i.caducidad)
                .filter(Boolean)
                .sort()[0]
                ? fechaCorta(
                    (inventario ?? [])
                      .map((i) => i.caducidad)
                      .filter(Boolean)
                      .sort()[0],
                  )
                : "—"
            }
          />
        </section>

        {isLoading ? <CargandoBloque filas={4} /> : null}
        {!isLoading && !inventario?.length ? <SeccionVacia mensaje="Sin inventario registrado." /> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {(inventario ?? []).map((i) => {
            const bajo = i.stock_minimo != null && i.cantidad_disponible <= i.stock_minimo;
            const dias =
              i.consumo_diario && i.consumo_diario > 0
                ? Math.floor(i.cantidad_disponible / i.consumo_diario)
                : null;
            return (
              <Card key={i.id} className="gap-0 py-4">
                <CardContent className="px-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{i.producto}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[capitalizar(i.categoria), i.presentacion].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        bajo
                          ? "shrink-0 border-destructive/25 bg-destructive/10 text-destructive"
                          : "shrink-0 border-success/25 bg-success/10 text-success"
                      }
                    >
                      {bajo ? "Reponer" : "Suficiente"}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <FilaDato etiqueta="Disponible" valor={`${numero(i.cantidad_disponible, 1)} u.`} />
                    <FilaDato etiqueta="Stock mínimo" valor={i.stock_minimo != null ? numero(i.stock_minimo, 1) : "—"} />
                    <FilaDato etiqueta="Consumo diario" valor={i.consumo_diario != null ? numero(i.consumo_diario, 1) : "—"} />
                    <FilaDato etiqueta="Cobertura" valor={dias != null ? `${dias} días` : "—"} />
                    <FilaDato etiqueta="Lote / caducidad" valor={`${i.lote ?? "—"} · ${i.caducidad ? fechaCorta(i.caducidad) : "—"}`} />
                    <FilaDato etiqueta="Próxima entrega" valor={i.proxima_entrega ? fechaCorta(i.proxima_entrega) : "—"} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
