import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PACIENTE_ID, usePaciente } from "@/hooks/useCuidados";
import { useRol } from "@/hooks/useSesion";
import { supabase } from "@/integrations/supabase/client";
import { camposModificados, puedeEditarPaciente, validarPaciente } from "@/lib/permisos";

export const Route = createFileRoute("/_authenticated/paciente")({
  head: () => ({
    meta: [
      { title: "Ficha de la paciente · Centro de Cuidados" },
      {
        name: "description",
        content:
          "Edita los datos personales, de contacto, diagnóstico, preferencias y notas asistenciales de la paciente.",
      },
      { property: "og:title", content: "Ficha de la paciente" },
      {
        property: "og:description",
        content: "Datos personales, contacto, diagnóstico y preferencias del cuidado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Paciente,
});

type Formulario = Record<string, string>;

const CAMPOS_TEXTO = [
  "nombre",
  "fecha_nacimiento",
  "documento",
  "grupo_sanguineo",
  "telefono",
  "correo",
  "direccion",
  "ciudad",
  "contacto_emergencia_nombre",
  "contacto_emergencia_telefono",
  "diagnostico_principal",
  "modalidad_dialisis",
  "peso_seco",
  "alergias",
  "resumen_clinico",
  "preferencias",
  "notas_asistenciales",
  "notas",
] as const;

function aFormulario(datos: Record<string, unknown> | null | undefined): Formulario {
  const salida: Formulario = {};
  for (const campo of CAMPOS_TEXTO) {
    const valor = datos?.[campo];
    salida[campo] = valor === null || valor === undefined ? "" : String(valor);
  }
  return salida;
}

function Paciente() {
  const { data: paciente, isLoading } = usePaciente();
  const { roles } = useRol();
  const qc = useQueryClient();
  const editable = puedeEditarPaciente(roles);

  const [form, setForm] = useState<Formulario>(() => aFormulario(null));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (paciente) setForm(aFormulario(paciente as Record<string, unknown>));
  }, [paciente]);

  const original = aFormulario((paciente ?? null) as Record<string, unknown> | null);
  const cambiados = camposModificados(original, form);

  function set(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function intentarGuardar() {
    const detectados = validarPaciente({
      nombre: form['nombre'] ?? "",
      telefono: form['telefono'] ?? "",
      correo: form['correo'] ?? "",
      peso_seco: form['peso_seco'] ?? "",
    });
    setErrores(detectados);
    if (Object.keys(detectados).length > 0) {
      toast.error("Revisa los campos marcados.");
      return;
    }
    if (cambiados.length === 0) {
      toast.info("No hay cambios por guardar.");
      return;
    }
    setConfirmar(true);
  }

  async function guardar() {
    setGuardando(true);
    const cambios: Record<string, string | number | null> = {};
    for (const campo of cambiados) {
      const valor = (form[campo] ?? "").trim();
      if (campo === "peso_seco") cambios[campo] = valor === "" ? null : Number(valor);
      else cambios[campo] = valor === "" ? null : valor;
    }
    const { error } = await supabase.from("pacientes").update(cambios).eq("id", PACIENTE_ID);
    setGuardando(false);
    setConfirmar(false);
    if (error) {
      toast.error("No se pudo guardar. Puede que tu rol no tenga permiso de edición.");
      return;
    }
    void qc.invalidateQueries({ queryKey: ["paciente"] });
    void qc.invalidateQueries({ queryKey: ["auditoria"] });
    toast.success(`Ficha actualizada (${cambiados.length} campos). El cambio quedó registrado en auditoría.`);
  }

  function cancelar() {
    setForm(aFormulario((paciente ?? null) as Record<string, unknown> | null));
    setErrores({});
    toast.info("Cambios descartados.");
  }

  function campo(nombre: string, etiqueta: string, tipo = "text") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={nombre}>{etiqueta}</Label>
        <Input
          id={nombre}
          type={tipo}
          value={form[nombre] ?? ""}
          disabled={!editable}
          onChange={(e) => set(nombre, e.target.value)}
        />
        {errores[nombre] ? <p className="text-xs text-destructive">{errores[nombre]}</p> : null}
      </div>
    );
  }

  function area(nombre: string, etiqueta: string, ayuda?: string) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={nombre}>{etiqueta}</Label>
        <Textarea
          id={nombre}
          rows={4}
          value={form[nombre] ?? ""}
          disabled={!editable}
          onChange={(e) => set(nombre, e.target.value)}
        />
        {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
      </div>
    );
  }

  return (
    <AppShell
      titulo="Ficha de la paciente"
      descripcion="Datos personales, contacto, diagnóstico y preferencias"
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando ficha…</p>
      ) : (
        <div className="space-y-4">
          {!editable ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-3 py-4 text-sm">
                <ShieldAlert className="mt-0.5 size-4 text-destructive" />
                <p>
                  Tu rol es de solo lectura: puedes consultar la ficha, pero no modificarla. Solicita el
                  cambio al equipo de administración.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Datos personales</CardTitle>
              <CardDescription>Identificación básica de la paciente.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {campo("nombre", "Nombre completo")}
              {campo("fecha_nacimiento", "Fecha de nacimiento", "date")}
              {campo("documento", "Documento de identidad")}
              {campo("grupo_sanguineo", "Grupo sanguíneo")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contacto</CardTitle>
              <CardDescription>Datos de localización y contacto de emergencia.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {campo("telefono", "Teléfono", "tel")}
              {campo("correo", "Correo", "email")}
              {campo("direccion", "Dirección")}
              {campo("ciudad", "Ciudad")}
              {campo("contacto_emergencia_nombre", "Contacto de emergencia")}
              {campo("contacto_emergencia_telefono", "Teléfono de emergencia", "tel")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Diagnóstico y resumen</CardTitle>
              <CardDescription>Situación clínica de referencia para el equipo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {campo("diagnostico_principal", "Diagnóstico principal")}
                {campo("modalidad_dialisis", "Modalidad de diálisis")}
                {campo("peso_seco", "Peso seco (kg)")}
                {campo("alergias", "Alergias")}
              </div>
              {area("resumen_clinico", "Resumen clínico")}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preferencias y datos asistenciales</CardTitle>
              <CardDescription>
                Información no sensible útil para el cuidado diario (rutinas, gustos, movilidad).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {area("preferencias", "Preferencias personales", "Horarios, comidas, acompañamiento, idioma.")}
              {area("notas_asistenciales", "Notas asistenciales", "Movilidad, apoyo necesario, rutinas de relevo.")}
              {area("notas", "Notas generales")}
            </CardContent>
          </Card>

          {editable ? (
            <div className="sticky bottom-24 z-20 flex flex-col gap-2 rounded-2xl border border-border bg-background/95 p-3 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:bottom-4">
              <p className="text-xs text-muted-foreground">
                {cambiados.length === 0
                  ? "Sin cambios pendientes."
                  : `${cambiados.length} campo(s) modificados: ${cambiados.join(", ")}`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelar} disabled={cambiados.length === 0}>
                  Cancelar
                </Button>
                <Button onClick={intentarGuardar} disabled={guardando} className="gap-2">
                  {guardando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Guardar
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambios en la ficha</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a modificar {cambiados.length} campo(s): {cambiados.join(", ")}. Quedará registrado quién
              hizo el cambio, cuándo y qué campos se modificaron.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={guardar}>Guardar cambios</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
