import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { FilaDato, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActividades, useConstantes, useMedicamentos, useSesionesDialisis } from "@/hooks/useCuidados";
import { useRol } from "@/hooks/useSesion";
import { supabase } from "@/integrations/supabase/client";
import { ISO_HOY, capitalizar, fechaHora, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/enfermeria")({
  head: () => ({
    meta: [
      { title: "Modo enfermería · Centro de Cuidados" },
      {
        name: "description",
        content: "Checklist de turno, registro rápido de constantes y parte de enfermería para el equipo asistencial.",
      },
      { property: "og:title", content: "Modo enfermería" },
      { property: "og:description", content: "Vista operativa de turno para el personal de enfermería." },
    ],
  }),
  component: Enfermeria,
});

const CHECKLIST = [
  "Higiene de manos y mascarilla antes del intercambio",
  "Revisar orificio de salida del catéter (enrojecimiento, secreción)",
  "Comprobar caducidad y concentración de las bolsas",
  "Registrar peso previo y posterior al intercambio",
  "Anotar aspecto del líquido drenado",
  "Medir presión arterial antes y después",
  "Registrar medicación administrada",
  "Dejar parte de turno con incidencias",
];

function Enfermeria() {
  const queryClient = useQueryClient();
  const { rol } = useRol();
  const { data: constantes } = useConstantes(5);
  const { data: sesiones } = useSesionesDialisis(5);
  const { data: medicamentos } = useMedicamentos();
  const { data: actividades } = useActividades();
  const [hechos, setHechos] = useState<Record<string, boolean>>({});
  const [parte, setParte] = useState({ titulo: "", descripcion: "" });
  const [rapido, setRapido] = useState({ sis: "", dia: "", fc: "", sat: "" });

  const hoy = ISO_HOY();
  const tareasHoy = (actividades ?? []).filter((a) => a.fecha === hoy);

  const guardarConstantes = useMutation({
    mutationFn: async () => {
      const n = (v: string) => (v.trim() === "" ? null : Number(v));
      const { error } = await supabase.from("constantes").insert({
        medido_en: new Date().toISOString(),
        presion_sistolica: n(rapido.sis),
        presion_diastolica: n(rapido.dia),
        frecuencia_cardiaca: n(rapido.fc),
        saturacion: n(rapido.sat),
        origen: "enfermeria",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Constantes del turno registradas");
      setRapido({ sis: "", dia: "", fc: "", sat: "" });
      queryClient.invalidateQueries({ queryKey: ["constantes"] });
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarParte = useMutation({
    mutationFn: async () => {
      if (!parte.titulo.trim()) throw new Error("Indica un título para el parte");
      const { error } = await supabase.from("eventos_clinicos").insert({
        fecha: hoy,
        categoria: "cuidados",
        titulo: parte.titulo,
        descripcion: parte.descripcion || null,
        gravedad: "baja",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parte de turno guardado en el historial");
      setParte({ titulo: "", descripcion: "" });
      queryClient.invalidateQueries({ queryKey: ["eventos_clinicos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const completados = CHECKLIST.filter((c) => hechos[c]).length;

  return (
    <AppShell
      titulo="Modo enfermería"
      descripcion="Checklist de turno y registro operativo"
      acciones={
        <Badge variant="outline" className="shrink-0">
          Rol: {capitalizar(rol)}
        </Badge>
      }
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Checklist" valor={`${completados}/${CHECKLIST.length}`} />
          <Metrica etiqueta="Tareas de hoy" valor={tareasHoy.length} />
          <Metrica etiqueta="Última constante" valor={constantes?.[0] ? fechaHora(constantes[0].medido_en) : "—"} />
          <Metrica
            etiqueta="Última UF"
            valor={sesiones?.[0]?.ultrafiltracion_ml != null ? numero(sesiones[0].ultrafiltracion_ml) : "—"}
            unidad="ml"
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist del turno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CHECKLIST.map((item) => (
                <label key={item} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                  <Checkbox
                    checked={Boolean(hechos[item])}
                    onCheckedChange={(v) => setHechos({ ...hechos, [item]: Boolean(v) })}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="min-w-0">{item}</span>
                </label>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Constantes rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sis">Sistólica</Label>
                  <Input
                    id="sis"
                    inputMode="numeric"
                    value={rapido.sis}
                    onChange={(e) => setRapido({ ...rapido, sis: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dia">Diastólica</Label>
                  <Input
                    id="dia"
                    inputMode="numeric"
                    value={rapido.dia}
                    onChange={(e) => setRapido({ ...rapido, dia: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fc">Pulso</Label>
                  <Input
                    id="fc"
                    inputMode="numeric"
                    value={rapido.fc}
                    onChange={(e) => setRapido({ ...rapido, fc: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sat">SpO₂</Label>
                  <Input
                    id="sat"
                    inputMode="numeric"
                    value={rapido.sat}
                    onChange={(e) => setRapido({ ...rapido, sat: e.target.value })}
                  />
                </div>
                <Button
                  className="col-span-2 gap-1"
                  onClick={() => guardarConstantes.mutate()}
                  disabled={guardarConstantes.isPending}
                >
                  <CheckCircle2 className="size-4" /> Registrar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parte de turno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={parte.titulo}
                    onChange={(e) => setParte({ ...parte, titulo: e.target.value })}
                    placeholder="Turno de mañana sin incidencias"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desc">Observaciones</Label>
                  <Textarea
                    id="desc"
                    value={parte.descripcion}
                    onChange={(e) => setParte({ ...parte, descripcion: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={() => guardarParte.mutate()} disabled={guardarParte.isPending}>
                  Guardar parte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medicación a administrar</CardTitle>
          </CardHeader>
          <CardContent>
            {(medicamentos ?? []).filter((m) => m.estado === "activo").length ? (
              (medicamentos ?? [])
                .filter((m) => m.estado === "activo")
                .map((m) => (
                  <FilaDato
                    key={m.id}
                    etiqueta={`${m.nombre} · ${m.dosis ?? ""}`}
                    valor={(m.horarios ?? []).join(" · ") || m.frecuencia || "—"}
                  />
                ))
            ) : (
              <SeccionVacia mensaje="Sin medicación activa." />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
