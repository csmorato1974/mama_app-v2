import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bluetooth, Download, Smartphone, Watch } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { FilaDato } from "@/components/Tarjetas";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/wearable")({
  head: () => ({
    meta: [
      { title: "Dispositivos y wearables · Centro de Cuidados" },
      {
        name: "description",
        content:
          "Device Connector desacoplado con adaptadores preparados para Keep Health, Apple Health, Health Connect, BLE, API/SDK e importación de archivos.",
      },
      { property: "og:title", content: "Dispositivos y wearables" },
      { property: "og:description", content: "Conector de dispositivos en estado no conectado." },
    ],
  }),
  component: Wearable,
});

type Adaptador = {
  clave: string;
  nombre: string;
  descripcion: string;
  icono: typeof Watch;
  plataforma: string;
};

const ADAPTADORES: Adaptador[] = [
  {
    clave: "keep_health",
    nombre: "Keep Health",
    descripcion: "Adaptador previsto para pulseras y básculas compatibles con la app del fabricante.",
    icono: Watch,
    plataforma: "App del fabricante",
  },
  {
    clave: "apple_health",
    nombre: "Apple Health",
    descripcion: "Lectura de constantes desde HealthKit en dispositivos iOS.",
    icono: Smartphone,
    plataforma: "iOS",
  },
  {
    clave: "health_connect",
    nombre: "Health Connect",
    descripcion: "Lectura de constantes desde Health Connect en dispositivos Android.",
    icono: Smartphone,
    plataforma: "Android",
  },
  {
    clave: "ble",
    nombre: "Bluetooth LE",
    descripcion: "Emparejamiento directo con tensiómetro, báscula u oxímetro compatible.",
    icono: Bluetooth,
    plataforma: "Navegador / móvil",
  },
  {
    clave: "api_sdk",
    nombre: "API / SDK del fabricante",
    descripcion: "Sincronización servidor a servidor mediante credenciales del fabricante.",
    icono: Download,
    plataforma: "Servidor",
  },
  {
    clave: "importacion",
    nombre: "Importación de archivos",
    descripcion: "Carga manual de exportaciones CSV o JSON del dispositivo.",
    icono: Download,
    plataforma: "Manual",
  },
];

function Wearable() {
  return (
    <AppShell
      titulo="Dispositivos (wearable)"
      descripcion="Device Connector desacoplado — sin integraciones activas"
      acciones={
        <Badge variant="outline" className="shrink-0 border-warning/30 bg-warning/10 text-warning-foreground">
          No conectado
        </Badge>
      }
    >
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Módulo desacoplado del resto de la aplicación</AlertTitle>
          <AlertDescription>
            Ningún adaptador está conectado y no se sincronizan datos reales. Los adaptadores son plantillas: cuando se
            disponga de credenciales o permisos del dispositivo se activarán sin cambiar el resto de los módulos. Las
            constantes actuales provienen únicamente del registro manual o por voz.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado del conector</CardTitle>
          </CardHeader>
          <CardContent>
            <FilaDato etiqueta="Estado" valor="No conectado" />
            <FilaDato etiqueta="Última sincronización" valor="—" />
            <FilaDato etiqueta="Dispositivos vinculados" valor="0" />
            <FilaDato etiqueta="Métricas soportadas" valor="Presión, pulso, SpO₂, peso, pasos, sueño" />
            <FilaDato etiqueta="Unidades" valor="Métricas (kg, mmHg, °C, ml)" />
          </CardContent>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2">
          {ADAPTADORES.map((a) => (
            <Card key={a.clave} className="gap-0 py-4">
              <CardContent className="px-4">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <a.icono className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.nombre}</p>
                    <p className="text-xs text-muted-foreground">{a.plataforma}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                    Placeholder
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{a.descripcion}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() =>
                    toast.info(
                      `Adaptador ${a.nombre} preparado, sin integración activa. Requiere credenciales o permisos del dispositivo.`,
                    )
                  }
                >
                  Probar conexión
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
