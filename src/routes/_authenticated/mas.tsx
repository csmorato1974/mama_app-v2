import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { NAV } from "@/lib/navegacion";

export const Route = createFileRoute("/_authenticated/mas")({
  head: () => ({
    meta: [
      { title: "Todos los módulos · Centro de Cuidados" },
      {
        name: "description",
        content: "Acceso a todos los módulos de gestión del cuidado: clínico, administrativo y asistencial.",
      },
      { property: "og:title", content: "Todos los módulos" },
      { property: "og:description", content: "Índice completo del centro de cuidados." },
    ],
  }),
  component: Mas,
});

const GRUPOS = [
  { clave: "clinico", titulo: "Seguimiento clínico" },
  { clave: "gestion", titulo: "Gestión y administración" },
  { clave: "asistencia", titulo: "Equipo y asistencia" },
] as const;

function Mas() {
  return (
    <AppShell titulo="Todos los módulos" descripcion="Índice completo del centro de cuidados">
      <div className="space-y-7">
        {GRUPOS.map((grupo) => (
          <section key={grupo.clave}>
            <h2 className="pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {grupo.titulo}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {NAV.filter((item) => item.grupo === grupo.clave).map((item) => (
                <Link key={item.to} to={item.to} className="block">
                  <Card className="h-full gap-0 py-4 transition-colors hover:border-primary/40 hover:bg-secondary/40">
                    <CardContent className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <item.icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.descripcion}</span>
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
