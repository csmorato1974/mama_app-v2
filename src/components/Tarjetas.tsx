import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Metrica({
  etiqueta,
  valor,
  unidad,
  ayuda,
  estado = "neutro",
  icono,
}: {
  etiqueta: string;
  valor: string | number;
  unidad?: string;
  ayuda?: string;
  estado?: "neutro" | "bien" | "atencion" | "riesgo";
  icono?: ReactNode;
}) {
  const colores = {
    neutro: "text-foreground",
    bien: "text-success",
    atencion: "text-warning",
    riesgo: "text-destructive",
  } as const;

  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <p className="min-w-0 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {etiqueta}
          </p>
          {icono ? <span className="shrink-0 text-muted-foreground">{icono}</span> : null}
        </div>
        <p className={cn("mt-1 font-display text-2xl font-semibold tabular", colores[estado])}>
          {valor}
          {unidad ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unidad}</span> : null}
        </p>
        {ayuda ? <p className="mt-1 text-xs text-muted-foreground">{ayuda}</p> : null}
      </CardContent>
    </Card>
  );
}

export function SeccionVacia({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {mensaje}
    </div>
  );
}

export function EtiquetaSeveridad({ severidad }: { severidad: string | null }) {
  const mapa: Record<string, { texto: string; clase: string }> = {
    alta: { texto: "Alta", clase: "bg-destructive/12 text-destructive border-destructive/25" },
    media: { texto: "Media", clase: "bg-warning/15 text-warning-foreground border-warning/30" },
    baja: { texto: "Baja", clase: "bg-success/12 text-success border-success/25" },
  };
  const item = mapa[severidad ?? "baja"] ?? mapa.baja;
  return (
    <Badge variant="outline" className={cn("shrink-0", item.clase)}>
      {item.texto}
    </Badge>
  );
}

export function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-b border-border/70 py-2 last:border-0">
      <span className="min-w-0 text-xs text-muted-foreground">{etiqueta}</span>
      <span className="shrink-0 text-sm font-medium tabular">{valor}</span>
    </div>
  );
}

export function CargandoBloque({ filas = 3 }: { filas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
