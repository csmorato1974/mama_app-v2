import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Loader2, Send, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { usePaciente } from "@/hooks/useCuidados";
import { useRol } from "@/hooks/useSesion";
import { actualizarConfigIA, assistantChat, estadoIA } from "@/lib/openai.functions";

export const Route = createFileRoute("/_authenticated/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente de cuidados IA · Centro de Cuidados" },
      {
        name: "description",
        content:
          "Consulta la evolución clínica, la diálisis y los gastos con un asistente que usa solo los datos registrados.",
      },
      { property: "og:title", content: "Asistente de cuidados IA" },
      { property: "og:description", content: "Preguntas en lenguaje natural sobre el cuidado de la paciente." },
    ],
  }),
  component: Asistente,
});

const SUGERENCIAS = [
  "¿Cómo ha evolucionado la presión arterial estas dos semanas?",
  "Resume la ultrafiltración de las últimas sesiones",
  "¿Hay riesgo de quedarnos sin bolsas de diálisis este mes?",
  "¿Qué parámetros de laboratorio están fuera de rango?",
];

type Mensaje = { autor: "usuario" | "asistente"; texto: string };

function Asistente() {
  const { data: paciente } = usePaciente();
  const { esAdmin } = useRol();
  const [entrada, setEntrada] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [verAjustes, setVerAjustes] = useState(false);

  const preguntarFn = useServerFn(assistantChat);
  const estadoFn = useServerFn(estadoIA);
  const guardarFn = useServerFn(actualizarConfigIA);

  const estado = useQuery({ queryKey: ["estado-ia"], queryFn: () => estadoFn({}) });

  const preguntar = useMutation({
    mutationFn: async (mensaje: string) => {
      if (!paciente?.id) throw new Error("sin_paciente");
      return preguntarFn({ data: { mensaje, patient_id: paciente.id } });
    },
    onMutate: (mensaje) => {
      setMensajes((prev) => [...prev, { autor: "usuario", texto: mensaje }]);
      setEntrada("");
    },
    onSuccess: (respuesta) => {
      setMensajes((prev) => [
        ...prev,
        { autor: "asistente", texto: respuesta.ok ? respuesta.texto : respuesta.mensaje },
      ]);
      if (!respuesta.ok) toast.error(respuesta.mensaje);
      void estado.refetch();
    },
    onError: () => toast.error("No se pudo contactar con el asistente"),
  });

  const guardar = useMutation({
    mutationFn: guardarFn,
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Configuración de IA actualizada");
        void estado.refetch();
      } else {
        toast.error(r.mensaje);
      }
    },
    onError: () => toast.error("No se pudo guardar la configuración"),
  });

  const enviar = (texto: string) => {
    const limpio = texto.trim();
    if (limpio.length < 2 || preguntar.isPending) return;
    preguntar.mutate(limpio);
  };

  const cfg = estado.data?.config;
  const uso = estado.data?.consumo;
  const configurada = estado.data?.configurada ?? false;
  const activa = configurada && (cfg?.ia_activa ?? false);

  return (
    <AppShell titulo="Asistente IA" descripcion="Preguntas sobre el cuidado con los datos registrados">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {activa ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <AlertTriangle className="size-4 text-destructive" />
              )}
              {configurada ? (activa ? "IA activa" : "IA desactivada") : "Configuración pendiente"}
              <Badge variant="outline">{estado.data?.proveedor ?? "OpenAI (API propia)"}</Badge>
              {cfg ? <Badge variant="secondary">Modelo: {cfg.modelo}</Badge> : null}
            </CardTitle>
            <CardDescription>
              {configurada
                ? `Consumo aproximado: ${uso?.diaUsuario ?? 0}/${cfg?.limite_diario_usuario ?? 0} consultas hoy · ${uso?.mesUsuario ?? 0}/${cfg?.limite_mensual_usuario ?? 0} este mes · coste estimado del mes ${estado.data?.coste_mes_usd ?? 0} USD`
                : "Falta el secreto OPENAI_API_KEY en el backend. Un administrador debe configurarlo para activar el asistente."}
            </CardDescription>
          </CardHeader>
          {esAdmin ? (
            <CardContent className="space-y-4">
              <Button variant="outline" size="sm" onClick={() => setVerAjustes((v) => !v)}>
                <Settings2 className="mr-2 size-4" /> {verAjustes ? "Ocultar ajustes" : "Ajustes de IA (administración)"}
              </Button>

              {verAjustes && cfg ? (
                <div className="space-y-4 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label className="text-sm">IA activada</Label>
                      <p className="text-xs text-muted-foreground">Desactívala para bloquear todas las llamadas.</p>
                    </div>
                    <Switch
                      checked={cfg.ia_activa}
                      onCheckedChange={(valor) => guardar.mutate({ data: { ia_activa: valor } })}
                    />
                  </div>

                  <FormularioAjustes
                    cfg={cfg}
                    pendiente={guardar.isPending}
                    onGuardar={(valores) => guardar.mutate({ data: valores })}
                  />

                  <div className="space-y-2 rounded-md border border-border p-3 text-xs">
                    <p className="font-medium text-foreground">Proveedor de IA por función</p>
                    {(estado.data?.proveedores ?? []).map((p) => (
                      <div key={p.funcion} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground">{p.etiqueta}</span>
                        <span className="flex items-center gap-2">
                          <Badge variant={p.proveedor.startsWith("OpenAI") ? "secondary" : "destructive"}>
                            {p.proveedor}
                          </Badge>
                          <span className="text-muted-foreground">{p.modelo}</span>
                        </span>
                      </div>
                    ))}
                    <p className="text-muted-foreground">
                      Ninguna función usa IA de Lovable: si falta OPENAI_API_KEY se muestra configuración pendiente y no
                      hay proveedor alternativo.
                    </p>
                  </div>

                  <div className="space-y-1 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Documentación para administradores</p>
                    <p>
                      1. Añade el secreto <strong>OPENAI_API_KEY</strong> en el backend (Secrets). La clave se usa solo en
                      el servidor: nunca llega al navegador ni se guarda en tablas.
                    </p>
                    <p>
                      2. El modelo por defecto es <strong>gpt-4o-mini</strong>. Puedes cambiarlo aquí (campo Modelo) o con
                      la variable de entorno <strong>OPENAI_MODEL</strong>.
                    </p>
                    <p>3. Los límites diarios y mensuales, por usuario y globales, se editan en este mismo panel.</p>
                    <p>
                      4. Todo consumo queda registrado (usuario, paciente, modelo, tokens, coste, latencia, estado) sin
                      guardar contenido clínico ni claves.
                    </p>
                    <p>
                      5. Chatbot, informes, OCR y voz comparten esta misma capa de servidor con OpenAI; los registros
                      históricos del panel de Lovable se conservan, solo se evitan nuevas llamadas.
                    </p>
                  </div>

                </div>
              ) : null}
            </CardContent>
          ) : null}
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> Sugerencias
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="h-auto py-2 text-left"
                disabled={!activa}
                onClick={() => enviar(s)}
              >
                {s}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {mensajes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              El asistente responde con los datos clínicos, de diálisis, laboratorio e inventario registrados, y siempre
              indica qué información falta.
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
            placeholder={activa ? "Escribe tu pregunta…" : "IA no disponible: configuración pendiente"}
            disabled={!activa}
            className="min-h-11 resize-none border-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(entrada);
              }
            }}
          />
          <Button
            size="icon"
            className="shrink-0"
            onClick={() => enviar(entrada)}
            disabled={preguntar.isPending || !activa}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

type Limites = {
  modelo: string;
  limite_diario_usuario: number;
  limite_mensual_usuario: number;
  limite_diario_global: number;
  limite_mensual_global: number;
};

function FormularioAjustes({
  cfg,
  pendiente,
  onGuardar,
}: {
  cfg: Limites;
  pendiente: boolean;
  onGuardar: (valores: Limites) => void;
}) {
  const [valores, setValores] = useState<Limites>(cfg);

  const campo = (clave: keyof Limites, etiqueta: string) => (
    <div className="space-y-1">
      <Label className="text-xs" htmlFor={clave}>
        {etiqueta}
      </Label>
      <Input
        id={clave}
        type={clave === "modelo" ? "text" : "number"}
        value={valores[clave]}
        onChange={(e) =>
          setValores((prev) => ({
            ...prev,
            [clave]: clave === "modelo" ? e.target.value : Number(e.target.value),
          }))
        }
      />
    </div>
  );

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar(valores);
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campo("modelo", "Modelo (OPENAI_MODEL)")}
        {campo("limite_diario_usuario", "Límite diario por usuario")}
        {campo("limite_mensual_usuario", "Límite mensual por usuario")}
        {campo("limite_diario_global", "Límite diario global")}
        {campo("limite_mensual_global", "Límite mensual global")}
      </div>
      <Button type="submit" size="sm" disabled={pendiente}>
        Guardar ajustes
      </Button>
    </form>
  );
}
