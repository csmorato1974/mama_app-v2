import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileScan, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, Metrica, SeccionVacia } from "@/components/Tarjetas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentos, useLaboratorio } from "@/hooks/useCuidados";
import { supabase } from "@/integrations/supabase/client";
import { ISO_HOY, capitalizar, fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos y analíticas · Centro de Cuidados" },
      {
        name: "description",
        content: "Informes médicos, recetas y resultados de laboratorio con lectura asistida (OCR) y archivo digital.",
      },
      { property: "og:title", content: "Documentos y analíticas" },
      { property: "og:description", content: "Archivo digital de informes y resultados de laboratorio." },
    ],
  }),
  component: Documentos,
});

function SubirDocumento() {
  const queryClient = useQueryClient();
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "informe", fecha: ISO_HOY(), institucion: "" });
  const [archivo, setArchivo] = useState<File | null>(null);

  const guardar = useMutation({
    mutationFn: async () => {
      if (!form.titulo.trim()) throw new Error("Indica un título");
      let storagePath: string | null = null;
      if (archivo) {
        const ruta = `${form.fecha}/${crypto.randomUUID()}-${archivo.name}`;
        const { error: errorSubida } = await supabase.storage.from("documentos").upload(ruta, archivo);
        if (errorSubida) throw errorSubida;
        storagePath = ruta;
      }
      const { error } = await supabase.from("documentos").insert({
        titulo: form.titulo,
        tipo: form.tipo,
        fecha: form.fecha,
        institucion: form.institucion || null,
        storage_path: storagePath,
        mime_type: archivo?.type ?? null,
        estado: storagePath ? "pendiente_ocr" : "validado",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento archivado");
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      setAbierta(false);
      setArchivo(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={abierta} onOpenChange={setAbierta}>
      <SheetTrigger asChild>
        <Button size="sm">Subir</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Subir documento</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-8 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo</Label>
              <Input id="tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inst">Institución</Label>
            <Input
              id="inst"
              value={form.institucion}
              onChange={(e) => setForm({ ...form, institucion: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="archivo">Archivo (PDF o imagen)</Label>
            <Input
              id="archivo"
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button className="w-full" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            {guardar.isPending ? <Loader2 className="size-4 animate-spin" /> : "Archivar documento"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Documentos() {
  const { data: documentos, isLoading } = useDocumentos();
  const { data: laboratorio } = useLaboratorio();
  const [ocrEnCurso, setOcrEnCurso] = useState<string | null>(null);

  const fueraRango = (laboratorio ?? []).filter((r) => r.fuera_de_rango);
  const areas = Array.from(new Set((laboratorio ?? []).map((r) => r.area)));

  return (
    <AppShell
      titulo="Documentos y analíticas"
      descripcion="Archivo digital, laboratorio y lectura OCR"
      acciones={<SubirDocumento />}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica etiqueta="Documentos" valor={documentos?.length ?? 0} />
          <Metrica etiqueta="Parámetros de laboratorio" valor={laboratorio?.length ?? 0} />
          <Metrica
            etiqueta="Fuera de rango"
            valor={fueraRango.length}
            estado={fueraRango.length ? "atencion" : "bien"}
          />
          <Metrica etiqueta="Áreas analizadas" valor={areas.length} />
        </section>

        <Alert>
          <FileScan className="size-4" />
          <AlertTitle>Lectura OCR asistida</AlertTitle>
          <AlertDescription>
            La extracción automática de texto y parámetros se ejecuta sobre los documentos archivados. En esta entrega
            funciona en modo simulado: el documento queda marcado como leído y los parámetros deben validarse
            manualmente antes de incorporarse al historial.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="documentos">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="laboratorio">Laboratorio</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="space-y-3 pt-4">
            {isLoading ? <CargandoBloque filas={4} /> : null}
            {!isLoading && !documentos?.length ? <SeccionVacia mensaje="Sin documentos archivados." /> : null}
            {(documentos ?? []).map((d) => (
              <Card key={d.id} className="gap-0 py-4">
                <CardContent className="px-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{d.titulo}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[capitalizar(d.tipo), fechaCorta(d.fecha), d.institucion].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                      {capitalizar(d.estado)}
                    </Badge>
                  </div>
                  {d.resumen ? <p className="mt-2 text-sm text-muted-foreground">{d.resumen}</p> : null}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1"
                    disabled={ocrEnCurso === d.id}
                    onClick={() => {
                      setOcrEnCurso(d.id);
                      setTimeout(() => {
                        setOcrEnCurso(null);
                        toast.info(
                          "Lectura OCR simulada: revisa los parámetros detectados antes de guardarlos en el historial.",
                        );
                      }, 900);
                    }}
                  >
                    {ocrEnCurso === d.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FileScan className="size-3.5" />
                    )}
                    Leer con OCR
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="laboratorio" className="space-y-4 pt-4">
            {areas.map((area) => (
              <Card key={area}>
                <CardHeader>
                  <CardTitle className="text-base">{capitalizar(area)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {(laboratorio ?? [])
                    .filter((r) => r.area === area)
                    .slice(0, 20)
                    .map((r) => (
                      <div
                        key={r.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/70 py-2 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm">{r.parametro}</p>
                          <p className="text-xs text-muted-foreground">{fechaCorta(r.fecha)}</p>
                        </div>
                        <span
                          className={
                            r.fuera_de_rango
                              ? "shrink-0 text-sm font-semibold tabular text-destructive"
                              : "shrink-0 text-sm font-medium tabular"
                          }
                        >
                          {r.valor != null ? numero(r.valor, 2) : (r.valor_texto ?? "—")} {r.unidad ?? ""}
                        </span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
            {!areas.length ? <SeccionVacia mensaje="Sin resultados de laboratorio." /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
