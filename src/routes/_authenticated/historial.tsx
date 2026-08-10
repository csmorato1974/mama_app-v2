import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEventosClinicos } from "@/hooks/useCuidados";
import { capitalizar, fechaLarga } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/historial")({
  head: () => ({
    meta: [
      { title: "Línea de tiempo clínica · Centro de Cuidados" },
      {
        name: "description",
        content: "Cronología de diagnósticos, ingresos, complicaciones, consultas y evolución de la paciente.",
      },
      { property: "og:title", content: "Línea de tiempo clínica" },
      { property: "og:description", content: "Historial clínico ordenado cronológicamente." },
    ],
  }),
  component: Historial,
});

const COLOR: Record<string, string> = {
  alta: "border-destructive/25 bg-destructive/10 text-destructive",
  media: "border-warning/30 bg-warning/10 text-warning-foreground",
  baja: "border-success/25 bg-success/10 text-success",
};

function Historial() {
  const { data: eventos, isLoading } = useEventosClinicos();

  return (
    <AppShell titulo="Línea de tiempo clínica" descripcion="Diagnósticos, ingresos y evolución">
      {isLoading ? (
        <CargandoBloque filas={5} />
      ) : eventos?.length ? (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {eventos.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[1.4rem] top-2 size-2.5 rounded-full bg-primary" />
              <Card className="gap-0 py-4">
                <CardContent className="px-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {fechaLarga(e.fecha)}
                        {e.fecha_fin ? ` — ${fechaLarga(e.fecha_fin)}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 ${COLOR[e.gravedad ?? "baja"] ?? ""}`}>
                      {capitalizar(e.categoria)}
                    </Badge>
                  </div>
                  {e.descripcion ? <p className="mt-2 text-sm text-muted-foreground">{e.descripcion}</p> : null}
                  {e.institucion || e.especialidad ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {[e.especialidad, e.institucion].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      ) : (
        <SeccionVacia mensaje="Sin eventos clínicos registrados." />
      )}
    </AppShell>
  );
}
