import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { EtiquetaSeveridad, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlertas } from "@/hooks/useAlertas";
import { useActividades, useContactos } from "@/hooks/useCuidados";
import { usePerfil } from "@/hooks/useSesion";
import { supabase } from "@/integrations/supabase/client";
import { ISO_HOY, capitalizar, hora } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cuidador")({
  head: () => ({
    meta: [
      { title: "Panel del cuidador · Centro de Cuidados" },
      {
        name: "description",
        content: "Tareas del día, relevos entre cuidadores, contactos de emergencia y notas de acompañamiento.",
      },
      { property: "og:title", content: "Panel del cuidador" },
      { property: "og:description", content: "Organización diaria del cuidado familiar." },
    ],
  }),
  component: Cuidador,
});

function Cuidador() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const { data: actividades } = useActividades();
  const { data: contactos } = useContactos();
  const { data: alertas } = useAlertas();
  const [relevo, setRelevo] = useState({ responsable: "", notas: "" });

  const hoy = ISO_HOY();
  const tareasHoy = (actividades ?? []).filter((a) => a.fecha === hoy);
  const pendientes = tareasHoy.filter((a) => a.estado === "pendiente");
  const emergencias = (contactos ?? []).filter((c) => c.es_contacto_emergencia);

  const completar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("actividades").update({ estado: "realizada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarea marcada como realizada");
      queryClient.invalidateQueries({ queryKey: ["actividades"] });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarRelevo = useMutation({
    mutationFn: async () => {
      if (!relevo.responsable.trim()) throw new Error("Indica quién recibe el relevo");
      const { error } = await supabase.from("eventos_clinicos").insert({
        fecha: hoy,
        categoria: "cuidados",
        titulo: `Relevo de cuidado a ${relevo.responsable}`,
        descripcion: relevo.notas || null,
        gravedad: "baja",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Relevo registrado");
      setRelevo({ responsable: "", notas: "" });
      queryClient.invalidateQueries({ queryKey: ["eventos_clinicos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell titulo="Panel del cuidador" descripcion="Tareas, relevos y contactos clave">
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Cuidador activo" valor={perfil?.nombre ?? "—"} />
          <Metrica etiqueta="Tareas de hoy" valor={tareasHoy.length} />
          <Metrica
            etiqueta="Pendientes"
            valor={pendientes.length}
            estado={pendientes.length ? "atencion" : "bien"}
          />
          <Metrica
            etiqueta="Alertas"
            valor={alertas?.length ?? 0}
            estado={(alertas?.length ?? 0) ? "atencion" : "bien"}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tareas de hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tareasHoy.length ? (
              tareasHoy.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[a.hora ? hora(`${hoy}T${a.hora}`) : null, capitalizar(a.tipo), a.responsable]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {a.estado === "pendiente" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => completar.mutate(a.id)}
                      disabled={completar.isPending}
                    >
                      Hecho
                    </Button>
                  ) : (
                    <Badge variant="outline" className="shrink-0">
                      {capitalizar(a.estado)}
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <SeccionVacia mensaje="No hay tareas programadas para hoy." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar relevo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="resp">Recibe el relevo</Label>
                <Input
                  id="resp"
                  value={relevo.responsable}
                  onChange={(e) => setRelevo({ ...relevo, responsable: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notas">Notas del relevo</Label>
                <Textarea
                  id="notas"
                  value={relevo.notas}
                  onChange={(e) => setRelevo({ ...relevo, notas: e.target.value })}
                  placeholder="Estado general, medicación pendiente, incidencias…"
                />
              </div>
              <Button className="w-full" onClick={() => guardarRelevo.mutate()} disabled={guardarRelevo.isPending}>
                Guardar relevo
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contactos de emergencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {emergencias.length ? (
                  emergencias.map((c) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.parentesco ?? c.especialidad ?? "—"}
                        </p>
                      </div>
                      {c.telefono ? (
                        <Button asChild size="sm" variant="outline" className="shrink-0">
                          <a href={`tel:${c.telefono}`}>Llamar</a>
                        </Button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <SeccionVacia mensaje="Sin contactos de emergencia definidos." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alertas a vigilar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alertas?.length ? (
                  alertas.slice(0, 5).map((a, i) => (
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
                  <SeccionVacia mensaje="Sin alertas activas." />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
