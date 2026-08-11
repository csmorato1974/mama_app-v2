import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mic, Sparkles, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGrabadoraVoz } from "@/hooks/useGrabadora";
import { supabase } from "@/integrations/supabase/client";
import { useSesion } from "@/hooks/useSesion";
import { interpretarRegistro, transcribirNota, type RegistroInterpretado } from "@/lib/ia.functions";
import { ISO_HOY } from "@/lib/format";

const CATEGORIAS_GASTO = [
  "medicamentos",
  "laboratorio",
  "medicos",
  "enfermeria",
  "transporte",
  "alimentacion",
  "suministros",
  "dialisis",
  "tramites",
  "otros",
];

function num(valor: string): number | null {
  const n = Number(valor.replace(",", "."));
  return valor.trim() === "" || Number.isNaN(n) ? null : n;
}

export function AccionRapida({
  abierta,
  onCambio,
}: {
  abierta: boolean;
  onCambio: (valor: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useSesion();
  const { data: personas } = useQuery({
    queryKey: ["personas-gasto"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, nombre").order("nombre");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; nombre: string }>;
    },
  });
  const { grabando, error: errorVoz, iniciar, detener } = useGrabadoraVoz();
  const [transcripcion, setTranscripcion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [interpretado, setInterpretado] = useState<RegistroInterpretado | null>(null);

  const [constantes, setConstantes] = useState({
    presion_sistolica: "",
    presion_diastolica: "",
    frecuencia_cardiaca: "",
    saturacion: "",
    temperatura: "",
    peso: "",
    observaciones: "",
  });
  const [dialisis, setDialisis] = useState({
    concentracion: "1.5%",
    volumen_infundido_ml: "8000",
    volumen_drenado_ml: "",
    aspecto_liquido: "claro",
    incidencias: "",
  });
  const [gasto, setGasto] = useState({
    fecha: ISO_HOY(),
    concepto: "",
    categoria: "medicamentos",
    importe: "",
    proveedor: "",
    notas: "",
    realizadoPor: "",
  });
  const [textoIAGasto, setTextoIAGasto] = useState("");
  const [procesandoIAGasto, setProcesandoIAGasto] = useState(false);

  useEffect(() => {
    if (user?.id && !gasto.realizadoPor) {
      setGasto((actual) => ({ ...actual, realizadoPor: user.id }));
    }
  }, [user?.id, gasto.realizadoPor]);
  const [nota, setNota] = useState({ titulo: "", descripcion: "" });

  const refrescar = (claves: string[]) => {
    claves.forEach((clave) => queryClient.invalidateQueries({ queryKey: [clave] }));
    queryClient.invalidateQueries({ queryKey: ["alertas"] });
  };

  const guardarConstantes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("constantes").insert({
        medido_en: new Date().toISOString(),
        presion_sistolica: num(constantes.presion_sistolica),
        presion_diastolica: num(constantes.presion_diastolica),
        frecuencia_cardiaca: num(constantes.frecuencia_cardiaca),
        saturacion: num(constantes.saturacion),
        temperatura: num(constantes.temperatura),
        peso: num(constantes.peso),
        observaciones: constantes.observaciones || null,
        origen: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Constantes registradas");
      refrescar(["constantes"]);
      onCambio(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarDialisis = useMutation({
    mutationFn: async () => {
      const infundido = num(dialisis.volumen_infundido_ml);
      const drenado = num(dialisis.volumen_drenado_ml);
      const { error } = await supabase.from("sesiones_dialisis").insert({
        fecha: ISO_HOY(),
        concentracion: dialisis.concentracion,
        volumen_infundido_ml: infundido,
        volumen_drenado_ml: drenado,
        ultrafiltracion_ml: infundido !== null && drenado !== null ? drenado - infundido : null,
        aspecto_liquido: dialisis.aspecto_liquido,
        incidencias: dialisis.incidencias || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sesión de diálisis registrada");
      refrescar(["sesiones_dialisis"]);
      onCambio(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarGasto = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gastos").insert({
        fecha: gasto.fecha,
        categoria: gasto.categoria,
        concepto: gasto.concepto,
        proveedor: gasto.proveedor || null,
        notas: gasto.notas || null,
        importe: num(gasto.importe) ?? 0,
        moneda: "BOB",
        created_by: user?.id ?? null,
        realizado_por: gasto.realizadoPor && gasto.realizadoPor !== "__none__" ? gasto.realizadoPor : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Gasto registrado");
      refrescar(["gastos"]);
      onCambio(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function rellenarGastoConIA() {
    if (!textoIAGasto.trim()) {
      toast.info("Escribe una descripción para que la IA rellene el gasto.");
      return;
    }
    setProcesandoIAGasto(true);
    try {
      const resultado = await interpretarRegistro({ data: { texto: textoIAGasto.trim() } });
      if (!resultado.gasto) {
        toast.warning("La IA no identificó un gasto en el texto.");
        return;
      }
      setGasto((actual) => ({
        ...actual,
        concepto: resultado.gasto?.concepto ?? actual.concepto,
        categoria: resultado.gasto?.categoria ?? actual.categoria,
        importe: resultado.gasto?.importe?.toString() ?? actual.importe,
        proveedor: resultado.gasto?.proveedor ?? actual.proveedor,
      }));
      toast.success("Campos del gasto rellenados. Revisa antes de guardar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo rellenar el gasto con IA.");
    } finally {
      setProcesandoIAGasto(false);
    }
  }

  const guardarNota = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("eventos_clinicos").insert({
        fecha: ISO_HOY(),
        categoria: "sintoma",
        titulo: nota.titulo,
        descripcion: nota.descripcion || null,
        gravedad: "baja",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nota añadida al historial");
      refrescar(["eventos_clinicos"]);
      onCambio(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function alternarGrabacion() {
    if (!grabando) {
      await iniciar();
      return;
    }
    const audio = await detener();
    if (!audio) return;
    setProcesando(true);
    try {
      const { texto, aviso } = await transcribirNota({
        data: { audioBase64: audio.base64, mimeType: audio.mimeType },
      });
      if (aviso) toast.warning(aviso);
      setTranscripcion(texto);

      if (texto.trim()) {
        const resultado = await interpretarRegistro({ data: { texto } });
        setInterpretado(resultado);
        aplicarInterpretacion(resultado);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo procesar la nota de voz");
    } finally {
      setProcesando(false);
    }
  }

  function aplicarInterpretacion(resultado: RegistroInterpretado) {
    if (resultado.constantes) {
      const c = resultado.constantes;
      setConstantes((prev) => ({
        presion_sistolica: c.presion_sistolica?.toString() ?? prev.presion_sistolica,
        presion_diastolica: c.presion_diastolica?.toString() ?? prev.presion_diastolica,
        frecuencia_cardiaca: c.frecuencia_cardiaca?.toString() ?? prev.frecuencia_cardiaca,
        saturacion: c.saturacion?.toString() ?? prev.saturacion,
        temperatura: c.temperatura?.toString() ?? prev.temperatura,
        peso: c.peso?.toString() ?? prev.peso,
        observaciones: c.observaciones ?? prev.observaciones,
      }));
    }
    if (resultado.dialisis) {
      const d = resultado.dialisis;
      setDialisis((prev) => ({
        concentracion: d.concentracion ?? prev.concentracion,
        volumen_infundido_ml: d.volumen_infundido_ml?.toString() ?? prev.volumen_infundido_ml,
        volumen_drenado_ml: d.volumen_drenado_ml?.toString() ?? prev.volumen_drenado_ml,
        aspecto_liquido: d.aspecto_liquido ?? prev.aspecto_liquido,
        incidencias: d.incidencias ?? prev.incidencias,
      }));
    }
    if (resultado.gasto) {
      const g = resultado.gasto;
      setGasto((prev) => ({
        concepto: g.concepto ?? prev.concepto,
        categoria: g.categoria ?? prev.categoria,
        importe: g.importe?.toString() ?? prev.importe,
        proveedor: g.proveedor ?? prev.proveedor,
      }));
    }
    if (resultado.nota) {
      setNota((prev) => ({
        titulo: resultado.nota?.titulo ?? prev.titulo,
        descripcion: resultado.nota?.descripcion ?? prev.descripcion,
      }));
    }
    toast.success(
      `Dictado interpretado como ${resultado.modulo}. Revisa los datos antes de guardar.`,
    );
  }

  return (
    <Sheet open={abierta} onOpenChange={onCambio}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Registro rápido</SheetTitle>
          <SheetDescription>
            Dicta una nota o rellena el formulario. Todo queda guardado de forma estructurada.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 px-4 pb-8">
          <div className="rounded-xl border border-border bg-secondary/50 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Dictado por voz</p>
                <p className="text-xs text-muted-foreground">
                  {grabando
                    ? "Grabando… habla con normalidad y pulsa para terminar."
                    : "La IA rellenará el formulario correspondiente."}
                </p>
              </div>
              <Button
                type="button"
                variant={grabando ? "destructive" : "default"}
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={alternarGrabacion}
                disabled={procesando}
                aria-label={grabando ? "Detener grabación" : "Iniciar grabación"}
              >
                {procesando ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : grabando ? (
                  <Square className="size-5" />
                ) : (
                  <Mic className="size-5" />
                )}
              </Button>
            </div>
            {errorVoz ? <p className="mt-2 text-xs text-destructive">{errorVoz}</p> : null}
            {transcripcion ? (
              <p className="mt-2 rounded-lg bg-background p-2 text-xs text-muted-foreground">
                “{transcripcion}”
                {interpretado?.resumen ? (
                  <span className="mt-1 block font-medium text-foreground">{interpretado.resumen}</span>
                ) : null}
              </p>
            ) : null}
          </div>

          <Tabs defaultValue="constantes">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="constantes">Constantes</TabsTrigger>
              <TabsTrigger value="dialisis">Diálisis</TabsTrigger>
              <TabsTrigger value="gasto">Gasto</TabsTrigger>
              <TabsTrigger value="nota">Nota</TabsTrigger>
            </TabsList>

            <TabsContent value="constantes" className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sis">Sistólica (mmHg)</Label>
                  <Input
                    id="sis"
                    inputMode="numeric"
                    value={constantes.presion_sistolica}
                    onChange={(e) => setConstantes({ ...constantes, presion_sistolica: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dia">Diastólica (mmHg)</Label>
                  <Input
                    id="dia"
                    inputMode="numeric"
                    value={constantes.presion_diastolica}
                    onChange={(e) => setConstantes({ ...constantes, presion_diastolica: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fc">Pulso (lpm)</Label>
                  <Input
                    id="fc"
                    inputMode="numeric"
                    value={constantes.frecuencia_cardiaca}
                    onChange={(e) => setConstantes({ ...constantes, frecuencia_cardiaca: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sat">Saturación (%)</Label>
                  <Input
                    id="sat"
                    inputMode="numeric"
                    value={constantes.saturacion}
                    onChange={(e) => setConstantes({ ...constantes, saturacion: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="temp">Temperatura (°C)</Label>
                  <Input
                    id="temp"
                    inputMode="decimal"
                    value={constantes.temperatura}
                    onChange={(e) => setConstantes({ ...constantes, temperatura: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="peso">Peso (kg)</Label>
                  <Input
                    id="peso"
                    inputMode="decimal"
                    value={constantes.peso}
                    onChange={(e) => setConstantes({ ...constantes, peso: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obs">Observaciones</Label>
                <Textarea
                  id="obs"
                  rows={2}
                  value={constantes.observaciones}
                  onChange={(e) => setConstantes({ ...constantes, observaciones: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => guardarConstantes.mutate()}
                disabled={guardarConstantes.isPending}
              >
                {guardarConstantes.isPending ? "Guardando…" : "Guardar constantes"}
              </Button>
            </TabsContent>

            <TabsContent value="dialisis" className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="conc">Concentración</Label>
                  <Select
                    value={dialisis.concentracion}
                    onValueChange={(v) => setDialisis({ ...dialisis, concentracion: v })}
                  >
                    <SelectTrigger id="conc">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.5%">1.5%</SelectItem>
                      <SelectItem value="2.3%">2.3%</SelectItem>
                      <SelectItem value="4.25%">4.25%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aspecto">Aspecto del líquido</Label>
                  <Select
                    value={dialisis.aspecto_liquido}
                    onValueChange={(v) => setDialisis({ ...dialisis, aspecto_liquido: v })}
                  >
                    <SelectTrigger id="aspecto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claro">Claro</SelectItem>
                      <SelectItem value="turbio">Turbio</SelectItem>
                      <SelectItem value="con fibrina">Con fibrina</SelectItem>
                      <SelectItem value="hemático">Hemático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inf">Infundido (mL)</Label>
                  <Input
                    id="inf"
                    inputMode="numeric"
                    value={dialisis.volumen_infundido_ml}
                    onChange={(e) => setDialisis({ ...dialisis, volumen_infundido_ml: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dre">Drenado (mL)</Label>
                  <Input
                    id="dre"
                    inputMode="numeric"
                    value={dialisis.volumen_drenado_ml}
                    onChange={(e) => setDialisis({ ...dialisis, volumen_drenado_ml: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc">Incidencias</Label>
                <Textarea
                  id="inc"
                  rows={2}
                  value={dialisis.incidencias}
                  onChange={(e) => setDialisis({ ...dialisis, incidencias: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => guardarDialisis.mutate()}
                disabled={guardarDialisis.isPending}
              >
                {guardarDialisis.isPending ? "Guardando…" : "Guardar sesión"}
              </Button>
            </TabsContent>

            <TabsContent value="gasto" className="space-y-3 pt-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <p className="text-sm font-medium">Rellenar con IA</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    value={textoIAGasto}
                    onChange={(e) => setTextoIAGasto(e.target.value)}
                    placeholder="Ej.: farmacia, 120 Bs, medicamentos"
                  />
                  <Button type="button" variant="outline" onClick={rellenarGastoConIA} disabled={procesandoIAGasto} className="shrink-0 gap-1">
                    {procesandoIAGasto ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Completar
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Revisa siempre los datos antes de guardar.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gasto-fecha">Fecha</Label>
                <Input id="gasto-fecha" type="date" value={gasto.fecha} onChange={(e) => setGasto({ ...gasto, fecha: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="concepto">Concepto</Label>
                <Input
                  id="concepto"
                  value={gasto.concepto}
                  onChange={(e) => setGasto({ ...gasto, concepto: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat">Categoría</Label>
                  <Select value={gasto.categoria} onValueChange={(v) => setGasto({ ...gasto, categoria: v })}>
                    <SelectTrigger id="cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_GASTO.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="imp">Importe (Bs)</Label>
                  <Input
                    id="imp"
                    inputMode="decimal"
                    value={gasto.importe}
                    onChange={(e) => setGasto({ ...gasto, importe: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prov">Proveedor</Label>
                <Input
                  id="prov"
                  value={gasto.proveedor}
                  onChange={(e) => setGasto({ ...gasto, proveedor: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gasto-realizado">Quién hizo el gasto</Label>
                <Select value={gasto.realizadoPor || "__none__"} onValueChange={(v) => setGasto({ ...gasto, realizadoPor: v === "__none__" ? "" : v })}>
                  <SelectTrigger id="gasto-realizado"><SelectValue placeholder="No especificado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No especificado</SelectItem>
                    {(personas ?? []).map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.id === user?.id ? `${persona.nombre} (yo)` : persona.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gasto-notas">Notas</Label>
                <Textarea id="gasto-notas" rows={2} value={gasto.notas} onChange={(e) => setGasto({ ...gasto, notas: e.target.value })} />
              </div>
              <Button
                className="w-full"
                onClick={() => guardarGasto.mutate()}
                disabled={guardarGasto.isPending || !gasto.concepto}
              >
                {guardarGasto.isPending ? "Guardando…" : "Guardar gasto"}
              </Button>
            </TabsContent>

            <TabsContent value="nota" className="space-y-3 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="tit">Título</Label>
                <Input
                  id="tit"
                  value={nota.titulo}
                  onChange={(e) => setNota({ ...nota, titulo: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  value={nota.descripcion}
                  onChange={(e) => setNota({ ...nota, descripcion: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => guardarNota.mutate()}
                disabled={guardarNota.isPending || !nota.titulo}
              >
                {guardarNota.isPending ? "Guardando…" : "Guardar nota"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
