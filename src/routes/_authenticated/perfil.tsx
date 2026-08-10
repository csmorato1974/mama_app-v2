import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePerfil, useRol, useSesion } from "@/hooks/useSesion";
import { useGuardarPerfil } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { ETIQUETA_ROL, MENSAJE_RECUPERACION, validarPerfil } from "@/lib/permisos";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil · Centro de Cuidados" },
      {
        name: "description",
        content: "Edita tu nombre y datos de contacto y gestiona tu acceso al centro de cuidados.",
      },
      { property: "og:title", content: "Mi perfil" },
      { property: "og:description", content: "Datos personales y acceso de cada integrante del equipo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user } = useSesion();
  const { data: perfil, isLoading } = usePerfil();
  const { rol, roles } = useRol();
  const guardar = useGuardarPerfil();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [relacion, setRelacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre ?? "");
    setTelefono(perfil.telefono ?? "");
    setRelacion(perfil.relacion ?? "");
  }, [perfil]);

  const cambios =
    nombre !== (perfil?.nombre ?? "") ||
    telefono !== (perfil?.telefono ?? "") ||
    relacion !== (perfil?.relacion ?? "");

  async function enviar() {
    const detectados = validarPerfil({ nombre, telefono });
    setErrores(detectados);
    if (Object.keys(detectados).length > 0) {
      toast.error("Revisa los campos marcados.");
      return;
    }
    try {
      await guardar.mutateAsync({
        id: user!.id,
        cambios: {
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          relacion: relacion.trim() || null,
        },
      });
      toast.success("Perfil actualizado. El cambio quedó registrado en auditoría.");
    } catch {
      toast.error("No se pudo guardar tu perfil. Inténtalo de nuevo.");
    }
  }

  function cancelar() {
    setNombre(perfil?.nombre ?? "");
    setTelefono(perfil?.telefono ?? "");
    setRelacion(perfil?.relacion ?? "");
    setErrores({});
  }

  async function pedirRecuperacion() {
    if (!user?.email) return;
    setEnviando(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setEnviando(false);
    toast.success(MENSAJE_RECUPERACION);
  }

  return (
    <AppShell titulo="Mi perfil" descripcion="Tus datos personales y tu acceso">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando perfil…</p>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mis datos</CardTitle>
              <CardDescription>Solo tú (y administración) podéis editar este perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="perfil-nombre">Nombre y apellido</Label>
                <Input id="perfil-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                {errores['nombre'] ? (
                  <p className="text-xs text-destructive">{errores['nombre']}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="perfil-telefono">Teléfono</Label>
                <Input
                  id="perfil-telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
                {errores['telefono'] ? (
                  <p className="text-xs text-destructive">{errores['telefono']}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="perfil-relacion">Relación con la paciente</Label>
                <Input
                  id="perfil-relacion"
                  value={relacion}
                  onChange={(e) => setRelacion(e.target.value)}
                  placeholder="Hija, enfermera de turno, nefrólogo…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Correo de acceso</Label>
                <Input value={user?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground">
                  El correo de acceso solo puede cambiarlo administración.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={cancelar} disabled={!cambios}>
                  Cancelar
                </Button>
                <Button onClick={enviar} disabled={!cambios || guardar.isPending} className="gap-2">
                  {guardar.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acceso y rol</CardTitle>
              <CardDescription>
                Los roles y permisos solo los asigna administración; no son editables desde aquí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3.5" /> {ETIQUETA_ROL[rol]}
                </Badge>
                {roles.length === 0 ? (
                  <Badge variant="outline">Sin rol asignado</Badge>
                ) : null}
                {perfil && !perfil.aprobado ? (
                  <Badge variant="destructive">Pendiente de aprobación</Badge>
                ) : null}
                {perfil && !perfil.activo ? <Badge variant="destructive">Acceso desactivado</Badge> : null}
              </div>
              <Button variant="outline" className="gap-2" onClick={pedirRecuperacion} disabled={enviando}>
                {enviando ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Cambiar contraseña por correo
              </Button>
              <p className="text-xs text-muted-foreground">
                Las contraseñas nunca se muestran ni se almacenan en claro: el cambio siempre se hace con un
                enlace de un solo uso enviado a tu correo.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
