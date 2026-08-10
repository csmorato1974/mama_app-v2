import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAlertas } from "@/hooks/useAlertas";
import {
  useConstantes,
  useGastos,
  useInventario,
  useLaboratorio,
  useMedicamentos,
  usePaciente,
  useSesionesDialisis,
} from "@/hooks/useCuidados";
import { generarInforme } from "@/lib/ia.functions";
import { bolivianos, fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de cuidados IA · Centro de Cuidados" },
      {
        name: "description",
        content: "Consulta la evolución clínica, la diálisis y los gastos con un asistente que usa los datos registrados.",
      },
      { property: "og:title", content: "Asistente de cuidados IA" },
      { property: "og:description", content: "Preguntas en lenguaje natural sobre el cuidado de la paciente." },
    ],
  }),
  component: Asistente;
});

const SUGERENCIAS = [
  "¿Cómo ha evolucionado la presión arterial estas dos semanas?",
  "Prepara un resumen para la próxima consulta de nefrología",
  "¿Hay riesgo de quedarnos sin bolsas de diálisis este mes?",
  "Resume el gasto del mes y qué categorías subieron",
];

type Mensaje = { autor: "usuario" | "asistente"; texto: string };

function Asistente() {
  const { data: paciente } = usePaciente();
  const { data: constantes } = useConstantes(21);
  const { data: sesiones } = useSesionesDialisis(21);
  const { data: medicamentos } = useMedicamentos();
  const { data: laboratorio } = useLaboratorio();
  const { data: inventario } = useInventario();
  const { data: gastos } = useGastos();
  const { data: alertas } = useAlertas();
  const [entrada, setEntrada] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const pedirInforme = useServerFn(generarInforme);

  const contexto = () =>
    [
      `Paciente: ${paciente?.nombre ?? "—"} · ${paciente?.diagnostico_principal ?? "—"} · ${paciente?.modalidad_dialisis ?? "—"} · peso seco ${paciente?.peso_seco ?? "—"} kg`,
      "Constantes recientes:",
      ...(constantes ?? [])
        .slice(0, 14)
        .map(
          (c) =>
            `- ${fechaCorta(c.medido_en)}: PA ${c.presion_sistolica ?? "—"}/${c.presion_diastolica ?? "—"} mmHg, FC ${c.frecuencia_cardiaca ?? "—"}, SpO2 ${c.saturacion ?? "—"}%, peso ${c.peso ?? "—"} kg, diuresis ${c.diuresis_ml ?? "—"} ml`,
        ),
      "Sesiones de diálisis peritoneal:",
      ...(sesiones ?? [])
        .slice(0, 14)
        .map(
          (s) =>
            `- ${fechaCorta(s.fecha)}: UF ${s.ultrafiltracion_ml ?? "—"} ml, drenado ${s.volumen_drenado_ml ?? "—"} ml, aspecto ${s.aspecto_liquido ?? "—"}, incidencias ${s.incidencias ?? "ninguna"}`,
        ),
      "Medicación activa:",
      ...(medicamentos ?? [])
        .filter((m) => m.estado === "activo")
        .map((m) => `- ${m.nombre} ${m.dosis ?? ""} ${m.frecuencia ?? ""}`),
      "Laboratorio fuera de rango:",
      ...(laboratorio ?? [])
        .filter((r) => r.fuera_de_rango)
        .slice(0, 12)
        .map((r) => `- ${fechaCorta(r.fecha)} ${r.parametro}: ${r.valor ?? r.valor_texto ?? "—"} ${r.unidad ?? ""}`),
      "Inventario CNS:",
      ...(inventario ?? [])
        .slice(0, 12)
        .map(
          (i) =>
            `- ${i.producto}: ${numero(Number(i.cantidad_disponible))} disponibles (mínimo ${i.stock_minimo ?? "—"}), próxima entrega ${i.proxima_entrega ?? "—"}`,
        ),
      "Gastos recientes:",
      ...(gastos ?? [])
        .slice(0, 15)
        .map((g) => `- ${fechaCorta(g.fecha)} ${g.categoria}: ${g.concepto} ${bolivianos(Number(g.importe))}`),
      "Alertas activas:",
      ...(alertas ?? []).map((a) => `- [${a.severidad}] ${a.titulo}: ${a.detalle}`),
    ].join("\n");

  const preguntar = useMutation({
    mutationFn: async (pregunta: string) => {
      const respuesta = await pedirInforme({
        data: {
          tipo: "consulta",
          contexto: `Pregunta de la familia: ${pregunta}\n\nDatos registrados:\n${contexto()}`,
        },
      });
      return respuesta.texto;
    },
    onMutate: (pregunta) => {
      setMensajes((prev) => [...prev, { autor: "usuario", texto: pregunta }]);
      setEntrada("");
    },
    onSuccess: (texto) => setMensajes((prev) => [...prev, { autor: "asistente", texto }]),
    onError: () => {
      toast.error("El asistente no está disponible ahora mismo");
      setMensajes((prev) => [
        ...prev,
        {
          autor: "asistente",
          texto:
            "No he podido generar la respuesta. Revisa la conexión con el servicio de IA e inténtalo de nuevo en unos minutos.",
        },
      ]);
    },
  });

  const enviar = (texto: string) => {
    const limpio = texto.trim();
    if (!limpio || preguntar.isPending) return;
    preguntar.mutate(limpio);
  };

  return (
    <AppShell titulo="Asistente IA" descripcion="Preguntas sobre el cuidado con los datos registrados">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> Sugerencias
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <Button key={s} variant="outline" size="sm" className="h-auto py-2 text-left" onClick={() => enviar(s)}>
                {s}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {mensajes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Pregunta lo que necesites: el asistente responde con los datos clínicos, de diálisis, inventario y gastos
              registrados en la aplicación.
            </p>
          ) : null}
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={
                m.autor === "usuario"
                  ? "ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground"
                  : "mr-auto max-w-[95%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 text-sm"
              }
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.texto}</p>
            </div>
          ))}
          {preguntar.isPending ? (
            <div className="mr-auto flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Analizando los registros…
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-24 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 lg:bottom-4">
          <Textarea
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="min-h-11 resize-none border-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(entrada);
              }
            }}
          />
          <Button size="icon" className="shrink-0" onClick={() => enviar(entrada)} disabled={preguntar.isPending}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
