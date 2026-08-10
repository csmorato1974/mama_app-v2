import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  Droplets,
  HeartPulse,
  Package,
  Pill,
  Receipt,
  Siren,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, EtiquetaSeveridad, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertas } from "@/hooks/useAlertas";
import {
  useActividades,
  useConstantes,
  useGastos,
  useInventario,
  useMedicamentos,
  usePaciente,
  useSesionesDialisis,
} from "@/hooks/useCuidados";
import { bolivianos, capitalizar, fechaCorta, hora, numero, toDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Resumen de hoy · Centro de Cuidados" },
      {
        name: "description",
        content:
          "Estado clínico del día, alertas activas, tareas de la agenda y situación de suministros y gastos.",
      },
      { property: "og:title", content: "Resumen de hoy · Centro de Cuidados" },
      {
        property: "og:description",
        content: "Panel diario del cuidado: constantes, diálisis, medicación, agenda y alertas.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data: paciente } = usePaciente();
  const { data: constantes } = useConstantes(14);
  const { data: sesiones } = useSesionesDialisis(14);
  const { data: actividades } = useActividades();
  const { data: medicamentos } = useMedicamentos();
  const { data: inventario } = useInventario();
  const { data: gastos } = useGastos();
  const { data: alertas } = useAlertas();

  const ultima = constantes?.[0];
  const ultimaSesion = sesiones?.[0];
  const pesoSeco = paciente?.peso_seco ?? null;

  const proximas = (actividades ?? [])
    .filter((a) => a.estado !== "completada" && differenceInCalendarDays(toDate(a.fecha)!, new Date()) >= 0)
    .slice(0, 5);

  const activos = (medicamentos ?? []).filter((m) => m.estado === "activo");
  const stockCritico = (inventario ?? []).filter(
    (i) => i.stock_minimo !== null && i.cantidad_disponible <= i.stock_minimo,
  );

  const mesActual = new Date().toISOString().slice(0, 7);
  const gastoMes = (gastos ?? [])
    .filter((g) => g.fecha.startsWith(mesActual))
    .reduce((suma, g) => suma + Number(g.importe), 0);

  const presionEstado =
    ultima?.presion_sistolica === null || ultima?.presion_sistolica === undefined
      ? "neutro"
      : ultima.presion_sistolica > 140 || ultima.presion_sistolica < 100
        ? "riesgo"
        : "bien";

  const ufEstado =
    ultimaSesion?.ultrafiltracion_ml === null || ultimaSesion?.ultrafiltracion_ml === undefined
      ? "neutro"
      : ultimaSesion.ultrafiltracion_ml < 400
        ? "riesgo"
        : "bien";

  return (
    <AppShell
      titulo="Resumen de hoy"
      descripcion="Lo esencial del cuidado en una sola pantalla"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="Presión arterial"
            valor={
              ultima?.presion_sistolica
                ? `${ultima.presion_sistolica}/${ultima.presion_diastolica ?? "—"}`
                : "—"
            }
            unidad="mmHg"
            ayuda={ultima ? `Medida ${fechaCorta(ultima.medido_en)}` : undefined}
            estado={presionEstado}
            icono={<HeartPulse className="size-4" />}
          />
          <Metrica
            etiqueta="Peso"
            valor={numero(ultima?.peso, 1)}
            unidad="kg"
            ayuda={pesoSeco ? `Peso seco ${numero(pesoSeco, 1)} kg` : undefined}
            estado={
              ultima?.peso && pesoSeco && ultima.peso - pesoSeco > 1.5 ? "atencion" : "bien"
            }
          />
          <Metrica
            etiqueta="Ultrafiltración"
            valor={numero(ultimaSesion?.ultrafiltracion_ml)}
            unidad="mL"
            ayuda={ultimaSesion ? `Sesión del ${fechaCorta(ultimaSesion.fecha)}` : undefined}
            estado={ufEstado}
            icono={<Droplets className="size-4" />}
          />
          <Metrica
            etiqueta="Saturación"
            valor={numero(ultima?.saturacion)}
            unidad="%"
            estado={ultima?.saturacion && ultima.saturacion < 92 ? "riesgo" : "bien"}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                <Siren className="size-4 shrink-0 text-destructive" />
                <span className="truncate">Alertas activas</span>
              </CardTitle>
              <Link
                to="/monitorizacion"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {!alertas ? (
                <CargandoBloque filas={2} />
              ) : alertas.length === 0 ? (
                <SeccionVacia mensaje="Sin alertas activas. Todos los parámetros están dentro de los rangos definidos." />
              ) : (
                <ul className="space-y-2">
                  {alertas.slice(0, 5).map((alerta) => (
                    <li key={alerta.id}>
                      <Link
                        to={alerta.ruta}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{alerta.titulo}</p>
                          <p className="text-xs text-muted-foreground">{alerta.detalle}</p>
                        </div>
                        <EtiquetaSeveridad severidad={alerta.severidad} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                <CalendarDays className="size-4 shrink-0" />
                <span className="truncate">Próximas citas</span>
              </CardTitle>
              <Link to="/agenda" className="shrink-0 text-xs font-medium text-primary hover:underline">
                Agenda
              </Link>
            </CardHeader>
            <CardContent>
              {!actividades ? (
                <CargandoBloque filas={3} />
              ) : proximas.length === 0 ? (
                <SeccionVacia mensaje="No hay actividades próximas registradas." />
              ) : (
                <ul className="space-y-3">
                  {proximas.map((act) => (
                    <li key={act.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{act.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fechaCorta(act.fecha)} · {hora(act.hora)} · {act.lugar ?? "—"}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-[0.65rem]">
                        {capitalizar(act.tipo)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link to="/medicacion" className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Pill className="size-3.5" /> Medicación activa
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">{activos.length}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activos
                      .slice(0, 3)
                      .map((m) => m.nombre)
                      .join(", ") || "Sin medicación registrada"}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventario" className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Package className="size-3.5" /> Suministros en riesgo
                  </p>
                  <p
                    className={`mt-1 font-display text-2xl font-semibold tabular ${
                      stockCritico.length > 0 ? "text-destructive" : "text-success"
                    }`}
                  >
                    {stockCritico.length}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {stockCritico.map((i) => i.producto).join(", ") || "Stock suficiente"}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/gastos" className="group">
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Receipt className="size-3.5" /> Gasto del mes
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular">
                    {bolivianos(gastoMes)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Incluye consultas, insumos y enfermería
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </section>

        {ultima?.observaciones || ultimaSesion?.observaciones ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Última nota del turno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {ultima?.observaciones ? <p>{ultima.observaciones}</p> : null}
              {ultimaSesion?.observaciones ? <p>{ultimaSesion.observaciones}</p> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
