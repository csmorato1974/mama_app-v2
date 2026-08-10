import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useGastos } from "@/hooks/useCuidados";
import { useSesion } from "@/hooks/useSesion";
import { supabase } from "@/integrations/supabase/client";
import { ISO_HOY, bolivianos, capitalizar, fechaCorta } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/gastos")({
  head: () => ({
    meta: [
      { title: "Gastos del cuidado · Centro de Cuidados" },
      {
        name: "description",
        content: "Control económico en bolivianos: medicamentos, laboratorio, transporte, enfermería y suministros.",
      },
      { property: "og:title", content: "Gastos del cuidado" },
      { property: "og:description", content: "Seguimiento del gasto mensual en bolivianos." },
    ],
  }),
  component: Gastos,
});

type Persona = { id: string; nombre: string };

function usePersonasGasto() {
  return useQuery({
    queryKey: ["personas-gasto"],
    queryFn: async (): Promise<Persona[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nombre")
        .order("nombre", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
  });
}

function NuevoGasto({
  personas,
  usuarioActualId,
}: {
  personas: Persona[];
  usuarioActualId: string | null;
}) {
  const queryClient = useQueryClient();
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState({
    fecha: ISO_HOY(),
    concepto: "",
    categoria: "medicamentos",
    importe: "",
    proveedor: "",
    notas: "",
    realizadoPor: "",
  });

  useEffect(() => {
    if (usuarioActualId && !form.realizadoPor) {
      setForm((actual) => ({ ...actual, realizadoPor: usuarioActualId }));
    }
  }, [usuarioActualId, form.realizadoPor]);

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.concepto.trim()) throw new Error("Indica el concepto del gasto");
      const importe = Number(form.importe.replace(",", "."));
      const { error } = await supabase.from("gastos").insert({
        fecha: form.fecha,
        concepto: form.concepto,
        categoria: form.categoria,
        importe: Number.isNaN(importe) ? 0 : importe,
        proveedor: form.proveedor || null,
        notas: form.notas || null,
        moneda: "BOB",
        created_by: usuarioActualId,
        realizado_por: form.realizadoPor || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gasto registrado");
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      setAbierta(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={abierta} onOpenChange={setAbierta}>
      <SheetTrigger asChild>
        <Button size="sm">Nuevo gasto</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Registrar gasto (Bs)</SheetTitle>
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
            <Label htmlFor="importe">Importe (Bs)</Label>
            <Input
              id="importe"
              inputMode="decimal"
              value={form.importe}
              onChange={(e) => setForm({ ...form, importe: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría</Label>
            <Input
              id="categoria"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prov">Proveedor</Label>
            <Input
              id="prov"
              value={form.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="realizadoPor">Quién hizo el gasto</Label>
            <select
              id="realizadoPor"
              value={form.realizadoPor}
              onChange={(e) => setForm({ ...form, realizadoPor: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No especificado</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.id === usuarioActualId ? `${persona.nombre} (yo)` : persona.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
          <Button className="col-span-2" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            Guardar gasto
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Gastos() {
  const { data: gastos, isLoading } = useGastos();
  const { user } = useSesion();
  const { data: personas } = usePersonasGasto();
  const nombres = new Map((personas ?? []).map((persona) => [persona.id, persona.nombre]));
  const mesActual = new Date().toISOString().slice(0, 7);

  const totalMes = (gastos ?? [])
    .filter((g) => g.fecha.startsWith(mesActual))
    .reduce((acc, g) => acc + Number(g.importe), 0);
  const total = (gastos ?? []).reduce((acc, g) => acc + Number(g.importe), 0);
  const extraordinarios = (gastos ?? []).filter((g) => g.extraordinario).length;

  const porCategoria = Object.entries(
    (gastos ?? []).reduce<Record<string, number>>((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] ?? 0) + Number(g.importe);
      return acc;
    }, {}),
  )
    .map(([categoria, importe]) => ({ categoria: capitalizar(categoria), importe }))
    .sort((a, b) => b.importe - a.importe)
    .slice(0, 8);

  return (
    <AppShell titulo="Gastos" descripcion="Control económico en bolivianos" acciones={<NuevoGasto personas={personas ?? []} usuarioActualId={user?.id ?? null} />}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Gasto del mes" valor={bolivianos(totalMes)} />
          <Metrica etiqueta="Gasto acumulado" valor={bolivianos(total)} />
          <Metrica etiqueta="Registros" valor={gastos?.length ?? 0} />
          <Metrica etiqueta="Extraordinarios" valor={extraordinarios} estado={extraordinarios ? "atencion" : "bien"} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gasto por categoría</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {porCategoria.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCategoria} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11 }} width={92} />
                  <Tooltip formatter={(v: number) => bolivianos(v)} />
                  <Bar dataKey="importe" name="Importe" fill="var(--color-primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <SeccionVacia mensaje="Sin gastos registrados." />
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Movimientos recientes</h2>
          {isLoading ? <CargandoBloque filas={4} /> : null}
          {(gastos ?? []).slice(0, 40).map((g) => (
            <Card key={g.id} className="gap-0 py-3">
              <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{g.concepto}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[fechaCorta(g.fecha), capitalizar(g.categoria), g.proveedor].filter(Boolean).join(" · ")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Registró: {nombres.get(g.created_by ?? "") ?? "Usuario no disponible"} · Realizó:{" "}
                    {nombres.get(g.realizado_por ?? "") ?? "No especificado"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular">{bolivianos(Number(g.importe))}</p>
                  {g.extraordinario ? (
                    <Badge variant="outline" className="mt-1 text-[0.6rem]">
                      Extraordinario
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && !gastos?.length ? <SeccionVacia mensaje="Sin gastos registrados." /> : null}
        </section>
      </div>
    </AppShell>
  );
}
