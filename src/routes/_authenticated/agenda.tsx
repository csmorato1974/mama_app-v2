import { createFileRoute } from "@tanstack/react-router";
import { differenceInCalendarDays } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActividades } from "@/hooks/useCuidados";
import { capitalizar, fechaLarga, hora, toDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda del cuidado · Centro de Cuidados" },
      {
        name: "description",
        content: "Consultas médicas, análisis, entregas de suministros, trámites y visitas de enfermería.",
      },
      { property: "og:title", content: "Agenda del cuidado" },
      { property: "og:description", content: "Todas las citas y tareas del cuidado en un calendario único." },
    ],
  }),
  component: Agenda,
});

function Agenda() {
  const { data: actividades } = useActividades();

  const proximas = (actividades ?? []).filter(
    (a) => differenceInCalendarDays(toDate(a.fecha)!, new Date()) >= 0,
  );
  const pasadas = (actividades ?? [])
    .filter((a) => differenceInCalendarDays(toDate(a.fecha)!, new Date()) < 0)
    .reverse();

  const Lista = ({ items }: { items: typeof proximas }) =>
    items.length === 0 ? (
      <SeccionVacia mensaje="Sin actividades registradas en este periodo." />
    ) : (
      <ul className="space-y-3">
        {items.map((act) => (
          <li key={act.id} className="rounded-xl border border-border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{act.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {fechaLarga(act.fecha)} · {hora(act.hora)}
                </p>
                {act.lugar ? <p className="text-xs text-muted-foreground">{act.lugar}</p> : null}
                {act.contacto?.nombre ? (
                  <p className="text-xs text-muted-foreground">
                    {act.contacto.nombre}
                    {act.contacto.especialidad ? ` · ${act.contacto.especialidad}` : ""}
                  </p>
                ) : null}
                {act.notas ? <p className="mt-1 text-xs">{act.notas}</p> : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="secondary" className="text-[0.65rem]">
                  {capitalizar(act.tipo)}
                </Badge>
                <Badge
                  variant={act.estado === "completada" ? "outline" : "default"}
                  className="text-[0.65rem]"
                >
                  {capitalizar(act.estado)}
                </Badge>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );

  return (
    <AppShell titulo="Agenda" descripcion="Citas, análisis, entregas y trámites">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximas ({proximas.length})</CardTitle>
          </CardHeader>
          <CardContent>{!actividades ? <CargandoBloque /> : <Lista items={proximas} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {!actividades ? <CargandoBloque /> : <Lista items={pasadas.slice(0, 12)} />}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
