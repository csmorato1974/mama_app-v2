import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { CargandoBloque, SeccionVacia } from "@/components/Tarjetas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useContactos } from "@/hooks/useCuidados";
import { capitalizar, fechaCorta } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/directorio")({
  head: () => ({
    meta: [
      { title: "Directorio asistencial · Centro de Cuidados" },
      {
        name: "description",
        content: "Médicos, enfermería, familia, proveedores y contactos de emergencia con teléfonos y horarios.",
      },
      { property: "og:title", content: "Directorio asistencial" },
      { property: "og:description", content: "Todos los contactos del equipo de cuidados." },
    ],
  }),
  component: Directorio,
});

function Directorio() {
  const { data: contactos, isLoading } = useContactos();
  const categorias = Array.from(new Set((contactos ?? []).map((c) => c.categoria)));

  return (
    <AppShell titulo="Directorio asistencial" descripcion="Equipo médico, familia y proveedores">
      <div className="space-y-6">
        {isLoading ? <CargandoBloque filas={4} /> : null}
        {!isLoading && !contactos?.length ? <SeccionVacia mensaje="Sin contactos registrados." /> : null}
        {categorias.map((categoria) => (
          <section key={categoria}>
            <h2 className="pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {capitalizar(categoria)}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(contactos ?? [])
                .filter((c) => c.categoria === categoria)
                .map((c) => (
                  <Card key={c.id} className="gap-0 py-4">
                    <CardContent className="px-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.nombre}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[c.especialidad ?? c.parentesco, c.institucion].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        {c.es_contacto_emergencia ? (
                          <Badge variant="destructive" className="shrink-0 text-[0.65rem]">
                            Emergencia
                          </Badge>
                        ) : null}
                      </div>
                      {c.horarios ? <p className="mt-2 text-xs text-muted-foreground">{c.horarios}</p> : null}
                      {c.proxima_consulta ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Próxima consulta: {fechaCorta(c.proxima_consulta)}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {c.telefono ? (
                          <Button asChild size="sm" variant="outline" className="gap-1">
                            <a href={`tel:${c.telefono}`}>
                              <Phone className="size-3.5" /> {c.telefono}
                            </a>
                          </Button>
                        ) : null}
                        {c.correo ? (
                          <Button asChild size="sm" variant="ghost" className="gap-1">
                            <a href={`mailto:${c.correo}`}>
                              <Mail className="size-3.5" /> Correo
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
