import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, FilaDato, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { usePaciente, useSesionesDialisis } from "@/hooks/useCuidados";
import { supabase } from "@/integrations/supabase/client";
import { ISO_HOY, fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dialisis")({
  head: () => ({
    meta: [
      { title: "Diálisis peritoneal · Centro de Cuidados" },
      {
        name: "description",
        content: "Registro de intercambios, ultrafiltración, aspecto del líquido drenado e incidencias diarias.",
      },
      { property: "og:title", content: "Diálisis peritoneal" },
      { property: "og:description", content: "Control diario de la diálisis peritoneal domiciliaria." },
    ],
  }),
  component: Dialisis,
});

function num(valor: string): number | null {
  const n = Number(valor.replace(",", "."));
  return valor.trim() === "" || Number.isNaN(n) ? null : n;
}

function FormularioSesion() {
  const queryClient = useQueryClient();
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState({
    fecha: ISO_HOY(),
    concentracion: "1.5%",
    numero_bolsas: "4",
    volumen_infundido_ml: "8000",
    volumen_drenado_ml: "",
    peso_previo: "",
    peso_posterior: "",
    aspecto_liquido: "claro",
    incidencias: "",
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const infundido = num(form.volumen_infundido_ml);
      const drenado = num(form.volumen_drenado_ml);
      const { error } = await supabase.from("sesiones_dialisis").insert({
        fecha: form.fecha,
        concentracion: form.concentracion,
        numero_bolsas: num(form.numero_bolsas),
        volumen_infundido_ml: infundido,
        volumen_drenado_ml: drenado,
        ultrafiltracion_ml: infundido !== null && drenado !== null ? drenado - infundido : null,
        peso_previo: num(form.peso_previo),
        peso_posterior: num(form.peso_posterior),
        aspecto_liquido: form.aspecto_liquido,
        incidencias: form.incidencias || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sesión registrada");
      queryClient.invalidateQueries({ queryKey: ["sesiones_dialisis"] });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
      setAbierta(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={abierta} onOpenChange={setAbierta}>
      <SheetTrigger asChild>
        <Button size="sm">Nueva sesión</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Registrar sesión de diálisis</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-3 px-4 pb-8 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conc">Concentración</Label>
            <Input
              id="conc"
              value={form.concentracion}
              onChange={(e) => setForm({ ...form, concentracion: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bolsas">Bolsas</Label>
            <Input
              id="bolsas"
              inputMode="numeric"
              value={form.numero_bolsas}
              onChange={(e) => setForm({ ...form, numero_bolsas: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aspecto">Aspecto del líquido</Label>
            <Input
              id="aspecto"
              value={form.aspecto_liquido}
              onChange={(e) => setForm({ ...form, aspecto_liquido: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inf">Infundido (ml)</Label>
            <Input
              id="inf"
              inputMode="numeric"
              value={form.volumen_infundido_ml}
              onChange={(e) => setForm({ ...form, volumen_infundido_ml: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dre">Drenado (ml)</Label>
            <Input
              id="dre"
              inputMode="numeric"
              value={form.volumen_drenado_ml}
              onChange={(e) => setForm({ ...form, volumen_drenado_ml: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pp">Peso previo (kg)</Label>
            <Input
              id="pp"
              inputMode="decimal"
              value={form.peso_previo}
              onChange={(e) => setForm({ ...form, peso_previo: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pd">Peso posterior (kg)</Label>
            <Input
              id="pd"
              inputMode="decimal"
              value={form.peso_posterior}
              onChange={(e) => setForm({ ...form, peso_posterior: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="inc">Incidencias</Label>
            <Textarea
              id="inc"
              value={form.incidencias}
              onChange={(e) => setForm({ ...form, incidencias: e.target.value })}
              placeholder="Alarmas, dolor, dificultad de drenaje…"
            />
          </div>
          <Button
            className="col-span-2"
            onClick={() => guardar.mutate()}
            disabled={guardar.isPending}
          >
            Guardar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Dialisis() {
  const { data: sesiones, isLoading } = useSesionesDialisis(90);
  const { data: paciente } = usePaciente();
  const ultima = sesiones?.[0];

  const serie = [...(sesiones ?? [])]
    .slice(0, 21)
    .reverse()
    .map((s) => ({ fecha: fechaCorta(s.fecha), uf: s.ultrafiltracion_ml ?? 0 }));

  const ufMedia =
    sesiones && sesiones.length
      ? sesiones.reduce((acc, s) => acc + (s.ultrafiltracion_ml ?? 0), 0) / sesiones.length
      : null;

  const turbios = (sesiones ?? []).filter((s) => (s.aspecto_liquido ?? "") !== "claro").length;

  return (
    <AppShell
      titulo="Diálisis peritoneal"
      descripcion="Intercambios, ultrafiltración e incidencias"
      acciones={<FormularioSesion />}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="UF última sesión"
            valor={ultima?.ultrafiltracion_ml != null ? numero(ultima.ultrafiltracion_ml) : "—"}
            unidad="ml"
            estado={(ultima?.ultrafiltracion_ml ?? 0) < 300 ? "atencion" : "bien"}
          />
          <Metrica
            etiqueta="UF media 90 días"
            valor={ufMedia != null ? numero(ufMedia) : "—"}
            unidad="ml"
          />
          <Metrica
            etiqueta="Peso seco objetivo"
            valor={paciente?.peso_seco != null ? numero(paciente.peso_seco, 1) : "—"}
            unidad="kg"
          />
          <Metrica
            etiqueta="Líquido no claro"
            valor={turbios}
            unidad="sesiones"
            estado={turbios > 0 ? "atencion" : "bien"}
            ayuda="Vigilar signos de peritonitis"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ultrafiltración de las últimas 3 semanas</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {serie.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(v: number) => `${numero(v)} ml`} />
                  <Bar dataKey="uf" name="Ultrafiltración" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <SeccionVacia mensaje="Sin sesiones registradas todavía." />
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Historial de sesiones</h2>
          {isLoading ? (
            <CargandoBloque />
          ) : sesiones?.length ? (
            <div className="space-y-3">
              {sesiones.slice(0, 30).map((s) => (
                <Card key={s.id} className="gap-0 py-4">
                  <CardContent className="px-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold">{fechaCorta(s.fecha)}</p>
                      <Badge
                        variant="outline"
                        className={
                          (s.aspecto_liquido ?? "claro") === "claro"
                            ? "shrink-0 border-success/25 bg-success/10 text-success"
                            : "shrink-0 border-destructive/25 bg-destructive/10 text-destructive"
                        }
                      >
                        {s.aspecto_liquido ?? "claro"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <FilaDato etiqueta="Concentración" valor={s.concentracion ?? "—"} />
                      <FilaDato
                        etiqueta="Infundido / drenado"
                        valor={`${numero(s.volumen_infundido_ml)} / ${numero(s.volumen_drenado_ml)} ml`}
                      />
                      <FilaDato etiqueta="Ultrafiltración" valor={`${numero(s.ultrafiltracion_ml)} ml`} />
                      <FilaDato
                        etiqueta="Peso previo / posterior"
                        valor={`${numero(s.peso_previo, 1)} / ${numero(s.peso_posterior, 1)} kg`}
                      />
                    </div>
                    {s.incidencias ? (
                      <p className="mt-2 rounded-lg bg-secondary/60 p-2 text-xs text-muted-foreground">
                        {s.incidencias}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <SeccionVacia mensaje="Aún no hay sesiones registradas." />
          )}
        </section>
      </div>
    </AppShell>
  );
}
