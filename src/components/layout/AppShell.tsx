import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, Menu, Plus, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AccionRapida } from "@/components/AccionRapida";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAlertas } from "@/hooks/useAlertas";
import { usePaciente } from "@/hooks/useCuidados";
import { usePerfil, useRol, useSesion } from "@/hooks/useSesion";
import { supabase } from "@/integrations/supabase/client";
import { NAV, NAV_MOVIL } from "@/lib/navegacion";
import { capitalizar, edadDesde, iniciales } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRUPOS: { clave: "clinico" | "gestion" | "asistencia"; titulo: string }[] = [
  { clave: "clinico", titulo: "Seguimiento clínico" },
  { clave: "gestion", titulo: "Gestión y administración" },
  { clave: "asistencia", titulo: "Equipo y asistencia" },
];

function ListaNavegacion({ onNavegar }: { onNavegar?: () => void }) {
  return (
    <nav className="space-y-6">
      {GRUPOS.map((grupo) => (
        <div key={grupo.clave}>
          <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {grupo.titulo}
          </p>
          <ul className="space-y-0.5">
            {NAV.filter((item) => item.grupo === grupo.clave).map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavegar}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-primary/10 text-primary hover:bg-primary/10" }}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function FichaPaciente() {
  const { data: paciente } = usePaciente();
  const edad = edadDesde(paciente?.fecha_nacimiento);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {iniciales(paciente?.nombre)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{paciente?.nombre ?? "Cargando…"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {edad ? `${edad} años · ` : ""}
            {paciente?.modalidad_dialisis ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  titulo,
  descripcion,
  acciones,
}: {
  children: ReactNode;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [accionAbierta, setAccionAbierta] = useState(false);
  const { user } = useSesion();
  const { data: perfil } = usePerfil();
  const { rol } = useRol();
  const { data: alertas } = useAlertas();
  const location = useLocation();

  const altas = (alertas ?? []).filter((a) => a.severidad === "alta").length;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col gap-5 border-r border-border bg-sidebar p-4 lg:flex lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto">
        <Link to="/inicio" className="flex items-center gap-2 px-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold">Centro de Cuidados</span>
            <span className="block truncate text-xs text-muted-foreground">Diálisis peritoneal</span>
          </span>
        </Link>
        <FichaPaciente />
        <ListaNavegacion />
        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                {iniciales(perfil?.nombre ?? user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{perfil?.nombre ?? user?.email}</p>
              <p className="truncate text-[0.7rem] text-muted-foreground">{capitalizar(rol)}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:flex sm:justify-between lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label="Abrir menú">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto p-4">
                  <div className="space-y-5 pt-6">
                    <FichaPaciente />
                    <ListaNavegacion onNavegar={() => setMenuAbierto(false)} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => supabase.auth.signOut()}
                    >
                      <LogOut className="size-4" /> Cerrar sesión
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold sm:text-xl">{titulo}</h1>
                {descripcion ? (
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">{descripcion}</p>
                ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {acciones}
              <Link to="/alertas" className="relative">
                <Button variant="outline" size="sm" className="gap-2">
                  Alertas
                  {altas > 0 ? (
                    <Badge variant="destructive" className="px-1.5 py-0 text-[0.65rem]">
                      {altas}
                    </Badge>
                  ) : null}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-12">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 items-end">
            {NAV_MOVIL.slice(0, 2).map((ruta) => {
              const item = NAV.find((n) => n.to === ruta)!;
              const activo = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium",
                    activo ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.corto}
                </Link>
              );
            })}
            <div className="flex justify-center">
              <Button
                size="icon"
                className="-mt-5 size-14 rounded-2xl shadow-lg"
                onClick={() => setAccionAbierta(true)}
                aria-label="Registro rápido"
              >
                <Plus className="size-6" />
              </Button>
            </div>
            {NAV_MOVIL.slice(2).map((ruta) => {
              const item = NAV.find((n) => n.to === ruta)!;
              const activo = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium",
                    activo ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.corto}
                </Link>
              );
            })}
          </div>
        </nav>

        <Button
          size="lg"
          className="fixed bottom-8 right-8 z-30 hidden gap-2 rounded-xl shadow-lg lg:inline-flex"
          onClick={() => setAccionAbierta(true)}
        >
          <Plus className="size-5" /> Registro rápido
        </Button>

        <AccionRapida abierta={accionAbierta} onCambio={setAccionAbierta} />
      </div>
    </div>
  );
}
