import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, FilaDato, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdministraciones, useMedicamentos } from "@/hooks/useCuidados";
import { supabase } from "@/integrations/supabase/client";
import { fechaCorta, fechaHora } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/medicacion")({
  head: () => ({
    meta: [
      { title: "Medicación · Centro de Cuidados" },
      {
        name: "description",
        content: "Tratamiento activo, horarios de toma, registro de administraciones y medicación suspendida.",
      },
      { property: "og:title", content: "Medicación" },
      { property: "og:description", content: "Control del tratamiento farmacológico de la paciente." },
    ],
  }),
  component: Medicacion,
});

function NuevoMedicamento() {
  const queryClient = useQueryClient();
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    dosis: "",
    frecuencia: "",
    horarios: "08:00",
    via: "oral",
    observaciones: "",
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.nombre.trim()) throw new Error("Indica el nombre del medicamento");
      const { error } = await supabase.from("medicamentos").insert({
        nombre: form.nombre,
        dosis: form.dosis || null,
        frecuencia: form.frecuencia || null,
        horarios: form.horarios ? form.horarios.split(",").map((h) => h.trim()) : null,
        via: form.via || null,
        observaciones: form.observaciones || null,
        estado: "activo",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Medicamento añadido");
      queryClient.invalidateQueries({ queryKey: ["medicamentos"] });
      setAbierta(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={abierta} onOpenChange={setAbierta}>
      <SheetTrigger asChild>
        <Button size="sm">Añadir</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Nuevo medicamento</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 px-4 pb-8 pt-4">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dosis">Dosis</Label>
            <Input id="dosis" value={form.dosis} onChange={(e) => setForm({ ...form, dosis: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="frec">Frecuencia</Label>
            <Input
              id="frec"
              value={form.frecuencia}
              onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
              placeholder="cada 12 h"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hor">Horarios</Label>
            <Input
              id="hor"
              value={form.horarios}
              onChange={(e) => setForm({ ...form, horarios: e.target.value })}
              placeholder="08:00, 20:00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="via">Vía</Label>
            <Input id="via" value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="obs">Observaciones</Label>
            <Textarea
              id="obs"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>
          <Button className="col-span-2" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            Guardar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Medicacion() {
  const queryClient = useQueryClient();
  const { data: medicamentos, isLoading } = useMedicamentos();
  const desde = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: administraciones } = useAdministraciones(desde);

  const activos = (medicamentos ?? []).filter((m) => m.estado === "activo");
  const suspendidos = (medicamentos ?? []).filter((m) => m.estado !== "activo");

  const registrar = useMutation({
    mutationFn: async (medicamentoId: string) => {
      const { error } = await supabase.from("administraciones").insert({
        medicamento_id: medicamentoId,
        administrado_en: new Date().toISOString(),
        estado: "administrado",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Toma registrada");
      queryClient.invalidateQueries({ queryKey: ["administraciones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      titulo="Medicación"
      descripcion="Tratamiento activo y registro de tomas"
      acciones={<NuevoMedicamento />}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Activos" valor={activos.length} unidad="fármacos" />
          <Metrica etiqueta="Suspendidos" valor={suspendidos.length} />
          <Metrica etiqueta="Tomas 7 días" valor={administraciones?.length ?? 0} />
          <Metrica
            etiqueta="Tomas hoy"
            valor={
              (administraciones ?? []).filter(
                (a) => new Date(a.administrado_en).toDateString() === new Date().toDateString(),
              ).length
            }
          />
        </section>

        <Tabs defaultValue="activos">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="suspendidos">Suspendidos</TabsTrigger>
            <TabsTrigger value="tomas">Tomas</TabsTrigger>
          </TabsList>

          <TabsContent value="activos" className="space-y-3 pt-4">
            {isLoading ? (
              <CargandoBloque />
            ) : activos.length ? (
              activos.map((m) => (
                <Card key={m.id} className="gap-0 py-4">
                  <CardContent className="px-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{m.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[m.dosis, m.frecuencia, m.via].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1"
                        onClick={() => registrar.mutate(m.id)}
                        disabled={registrar.isPending}
                      >
                        <CheckCircle2 className="size-4" /> Toma
                      </Button>
                    </div>
                    <div className="mt-2">
                      <FilaDato etiqueta="Horarios" valor={(m.horarios ?? []).join(" · ") || "—"} />
                      <FilaDato etiqueta="Inicio" valor={m.fecha_inicio ? fechaCorta(m.fecha_inicio) : "—"} />
                      <FilaDato
                        etiqueta="Prescriptor"
                        valor={(m as { prescriptor?: { nombre?: string } }).prescriptor?.nombre ?? "—"}
                      />
                    </div>
                    {m.observaciones ? (
                      <p className="mt-2 rounded-lg bg-secondary/60 p-2 text-xs text-muted-foreground">
                        {m.observaciones}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            ) : (
              <SeccionVacia mensaje="Sin medicación activa registrada." />
            )}
          </TabsContent>

          <TabsContent value="suspendidos" className="space-y-3 pt-4">
            {suspendidos.length ? (
              suspendidos.map((m) => (
                <Card key={m.id} className="gap-0 py-4">
                  <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{m.nombre}</p>
                      <p className="text-xs text-muted-foreground">{m.motivo ?? "Sin motivo registrado"}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {m.fecha_suspension ? fechaCorta(m.fecha_suspension) : "suspendido"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <SeccionVacia mensaje="No hay medicación suspendida." />
            )}
          </TabsContent>

          <TabsContent value="tomas" className="space-y-3 pt-4">
            {administraciones?.length ? (
              administraciones.map((a) => {
                const med = (medicamentos ?? []).find((m) => m.id === a.medicamento_id);
                return (
                  <Card key={a.id} className="gap-0 py-3">
                    <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
                      <p className="min-w-0 truncate text-sm">{med?.nombre ?? "Medicamento"}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {fechaHora(a.administrado_en)}
                      </span>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <SeccionVacia mensaje="Sin tomas registradas en los últimos 7 días." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
