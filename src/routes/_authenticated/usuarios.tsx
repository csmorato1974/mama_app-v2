import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2, Mail, Search, ShieldAlert, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRol, useSesion, type Rol } from "@/hooks/useSesion";
import { useAsignarRol, useAuditoria, useGuardarPerfil, useUsuarios, type Usuario } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { fechaHora } from "@/lib/format";
import {
  ETIQUETA_ROL,
  MENSAJE_RECUPERACION,
  ROLES,
  puedeGestionarUsuarios,
  validarPerfil,
} from "@/lib/permisos";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios y accesos · Centro de Cuidados" },
      {
        name: "description",
        content:
          "Gestión de usuarios del equipo de cuidados: roles, aprobación de accesos familiares y estado de cuenta.",
      },
      { property: "og:title", content: "Usuarios y accesos" },
      {
        property: "og:description",
        content: "Administración de roles, aprobaciones y estado de acceso del equipo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Usuarios,
});

type Pendiente =
  | { tipo: "estado"; usuario: Usuario; activo: boolean }
  | { tipo: "aprobar"; usuario: Usuario }
  | { tipo: "rol"; usuario: Usuario; rol: Rol };

function Usuarios() {
  const { user } = useSesion();
  const { roles } = useRol();
  const admin = puedeGestionarUsuarios(roles);
  const { data: usuarios, isLoading, error } = useUsuarios();
  const { data: auditoria } = useAuditoria(20);
  const guardarPerfil = useGuardarPerfil();
  const asignarRol = useAsignarRol();

  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [relacion, setRelacion] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);

  const lista = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return usuarios ?? [];
    return (usuarios ?? []).filter((u) =>
      [u.nombre, u.correo ?? "", u.relacion ?? "", ...u.roles].join(" ").toLowerCase().includes(texto),
    );
  }, [usuarios, busqueda]);

  const porAprobar = (usuarios ?? []).filter((u) => !u.aprobado);

  function abrirEdicion(u: Usuario) {
    setEditando(u);
    setNombre(u.nombre ?? "");
    setTelefono(u.telefono ?? "");
    setCorreo(u.correo ?? "");
    setRelacion(u.relacion ?? "");
    setErrores({});
  }

  async function guardarEdicion() {
    if (!editando) return;
    const detectados = validarPerfil({ nombre, telefono, correo });
    setErrores(detectados);
    if (Object.keys(detectados).length > 0) {
      toast.error("Revisa los campos marcados.");
      return;
    }
    try {
      await guardarPerfil.mutateAsync({
        id: editando.id,
        cambios: {
          nombre: nombre.trim(),
          telefono: telefono.trim() || null,
          correo: correo.trim() || null,
          relacion: relacion.trim() || null,
        },
      });
      setEditando(null);
      toast.success("Datos del usuario actualizados y registrados en auditoría.");
    } catch {
      toast.error("No se pudo guardar. Comprueba tus permisos de administración.");
    }
  }

  async function aplicarPendiente() {
    if (!pendiente) return;
    try {
      if (pendiente.tipo === "estado") {
        await guardarPerfil.mutateAsync({
          id: pendiente.usuario.id,
          cambios: { activo: pendiente.activo },
        });
        toast.success(pendiente.activo ? "Acceso activado." : "Acceso desactivado.");
      } else if (pendiente.tipo === "aprobar") {
        await guardarPerfil.mutateAsync({
          id: pendiente.usuario.id,
          cambios: { aprobado: true },
        });
        toast.success("Acceso aprobado.");
      } else {
        await asignarRol.mutateAsync({ userId: pendiente.usuario.id, rol: pendiente.rol });
        toast.success(`Rol actualizado a ${ETIQUETA_ROL[pendiente.rol]}.`);
      }
    } catch {
      toast.error("No se pudo aplicar el cambio. Comprueba tus permisos de administración.");
    }
    setPendiente(null);
  }

  async function enviarRecuperacion(u: Usuario) {
    if (!u.correo) {
      toast.error("Este usuario no tiene correo registrado.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(u.correo, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    toast.success(MENSAJE_RECUPERACION);
  }

  if (!admin) {
    return (
      <AppShell titulo="Usuarios y accesos" descripcion="Solo para administración">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-5 text-sm">
            <ShieldAlert className="mt-0.5 size-4 text-destructive" />
            <p>
              Esta sección es exclusiva del rol Administrador. Puedes editar tus propios datos en{" "}
              <a className="font-medium text-primary underline-offset-4 hover:underline" href="/perfil">
                Mi perfil
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell titulo="Usuarios y accesos" descripcion="Roles, aprobaciones y estado de cuenta">
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, correo o rol"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {porAprobar.length > 0 ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Accesos pendientes de aprobación</CardTitle>
              <CardDescription>
                Las cuentas nuevas no ven datos del cuidado hasta que se aprueban.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {porAprobar.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.correo}</p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setPendiente({ tipo: "aprobar", usuario: u })}
                  >
                    <Check className="size-4" /> Aprobar acceso
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Equipo ({lista.length})</CardTitle>
            <CardDescription>Las contraseñas nunca se muestran ni se editan desde aquí.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando usuarios…</p>
            ) : error ? (
              <p className="text-sm text-destructive">No se pudieron cargar los usuarios.</p>
            ) : lista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin resultados para esa búsqueda.</p>
            ) : (
              lista.map((u) => (
                <div key={u.id} className="space-y-3 rounded-2xl border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {u.nombre}
                        {u.id === user?.id ? " (tú)" : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.correo ?? "Sin correo"}</p>
                      {u.relacion ? (
                        <p className="truncate text-xs text-muted-foreground">{u.relacion}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={u.activo ? "secondary" : "destructive"} className="text-[0.68rem]">
                        {u.activo ? "Activo" : "Desactivado"}
                      </Badge>
                      {!u.aprobado ? (
                        <Badge variant="outline" className="text-[0.68rem]">
                          Pendiente
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Rol</Label>
                      <Select
                        value={u.roles[0] ?? ""}
                        onValueChange={(valor) =>
                          setPendiente({ tipo: "rol", usuario: u, rol: valor as Rol })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sin rol asignado" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((rol) => (
                            <SelectItem key={rol} value={rol}>
                              {ETIQUETA_ROL[rol]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end justify-between gap-2 rounded-xl bg-secondary/40 px-3 py-2">
                      <span className="text-xs font-medium">Acceso activo</span>
                      <Switch
                        checked={u.activo}
                        onCheckedChange={(valor) =>
                          setPendiente({ tipo: "estado", usuario: u, activo: valor })
                        }
                        aria-label="Activar o desactivar acceso"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => abrirEdicion(u)}>
                      <UserCog className="size-4" /> Editar datos
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2"
                      onClick={() => enviarRecuperacion(u)}
                    >
                      <Mail className="size-4" /> Enviar recuperación
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Auditoría reciente</CardTitle>
            <CardDescription>Usuario, fecha y campos modificados en cada cambio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(auditoria ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin movimientos registrados todavía.</p>
            ) : (
              (auditoria ?? []).map((registro) => {
                const detalle = registro.detalle as { campos?: string[] } | null;
                const autor = (usuarios ?? []).find((u) => u.id === registro.usuario_id);
                return (
                  <div key={registro.id} className="rounded-xl border border-border px-3 py-2 text-xs">
                    <p className="font-medium">
                      {registro.tabla} · {registro.accion}
                    </p>
                    <p className="text-muted-foreground">
                      {autor?.nombre ?? "Sistema"} · {fechaHora(registro.created_at)}
                      {detalle?.campos?.length ? ` · ${detalle.campos.join(", ")}` : ""}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(editando)} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar datos del usuario</DialogTitle>
            <DialogDescription>
              Nombre y datos de contacto. Las credenciales no se gestionan aquí.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-nombre">Nombre y apellido</Label>
              <Input id="u-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              {errores['nombre'] ? <p className="text-xs text-destructive">{errores['nombre']}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-correo">Correo de contacto</Label>
              <Input id="u-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              {errores['correo'] ? <p className="text-xs text-destructive">{errores['correo']}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-telefono">Teléfono</Label>
              <Input
                id="u-telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              {errores['telefono'] ? (
                <p className="text-xs text-destructive">{errores['telefono']}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-relacion">Relación / cargo</Label>
              <Input id="u-relacion" value={relacion} onChange={(e) => setRelacion(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicion} disabled={guardarPerfil.isPending}>
              {guardarPerfil.isPending ? <Loader2 className="size-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendiente)} onOpenChange={(abierto) => !abierto && setPendiente(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio sensible</AlertDialogTitle>
            <AlertDialogDescription>
              {pendiente?.tipo === "rol"
                ? `Vas a asignar el rol ${ETIQUETA_ROL[pendiente.rol]} a ${pendiente.usuario.nombre}. Cambiará lo que puede ver y editar.`
                : pendiente?.tipo === "aprobar"
                  ? `Vas a aprobar el acceso de ${pendiente.usuario.nombre} a los datos del cuidado.`
                  : pendiente
                    ? `Vas a ${pendiente.activo ? "activar" : "desactivar"} el acceso de ${pendiente.usuario.nombre}.`
                    : ""}
              {" "}Quedará registrado en auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={aplicarPendiente}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
