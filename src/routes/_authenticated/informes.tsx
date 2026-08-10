import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { FilaDato, Metrica } from "@/components/Tarjetas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertas } from "@/hooks/useAlertas";
import {
  useConstantes,
  useGastos,
  useLaboratorio,
  useMedicamentos,
  usePaciente,
  useSesionesDialisis,
} from "@/hooks/useCuidados";
import { bolivianos, fechaCorta, numero } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/informes")({
  head: () => ({
    meta: [
      { title: "Informes para consulta · Centro de Cuidados" },
      {
        name: "description",
        content: "Resúmenes clínicos y económicos listos para llevar a la consulta médica o presentar a la CNS.",
      },
      { property: "og:title", content: "Informes para consulta" },
      { property: "og:description", content: "Resúmenes de 30 días de evolución clínica y gasto." },
    ],
  }),
  component: Informes,
});

function Informes() {
  const { data: paciente } = usePaciente();
  const { data: constantes } = useConstantes(30);
  const { data: sesiones } = useSesionesDialisis(30);
  const { data: laboratorio } = useLaboratorio();
  const { data: medicamentos } = useMedicamentos();
  const { data: gastos } = useGastos();
  const { data: alertas } = useAlertas();
  const [generando, setGenerando] = useState(false);

  const media = (valores: (number | null)[]) => {
    const limpios = valores.filter((v): v is number => v != null);
    return limpios.length ? limpios.reduce((a, b) => a + b, 0) / limpios.length : null;
  };

  const sistolica = media((constantes ?? []).map((c) => c.presion_sistolica));
  const diastolica = media((constantes ?? []).map((c) => c.presion_diastolica));
  const uf = media((sesiones ?? []).map((s) => s.ultrafiltracion_ml));
  const peso = media((constantes ?? []).map((c) => (c.peso != null ? Number(c.peso) : null)));
  const mes = new Date().toISOString().slice(0, 7);
  const gastoMes = (gastos ?? [])
    .filter((g) => g.fecha.startsWith(mes))
    .reduce((acc, g) => acc + Number(g.importe), 0);
  const fueraRango = (laboratorio ?? []).filter((r) => r.fuera_de_rango).slice(0, 6);

  const texto = [
    `Informe de seguimiento — ${paciente?.nombre ?? "Paciente"}`,
    `Diagnóstico: ${paciente?.diagnostico_principal ?? "—"} · Modalidad: ${paciente?.modalidad_dialisis ?? "—"}`,
    `Presión arterial media (30 días): ${sistolica ? numero(sistolica) : "—"}/${diastolica ? numero(diastolica) : "—"} mmHg`,
    `Peso medio: ${peso ? numero(peso, 1) : "—"} kg (peso seco ${paciente?.peso_seco ? numero(paciente.peso_seco, 1) : "—"} kg)`,
    `Ultrafiltración media: ${uf ? numero(uf) : "—"} ml en ${sesiones?.length ?? 0} sesiones`,
    `Medicación activa: ${(medicamentos ?? []).filter((m) => m.estado === "activo").length} fármacos`,
    `Alertas activas: ${alertas?.length ?? 0}`,
    `Gasto del mes: ${bolivianos(gastoMes)}`,
  ].join("\n");

  return (
    <AppShell
      titulo="Informes"
      descripcion="Resúmenes para consulta médica y trámites"
      acciones={
        <Button
          size="sm"
          className="gap-1"
          disabled={generando}
          onClick={() => {
            setGenerando(true);
            navigator.clipboard
              ?.writeText(texto)
              .then(() => toast.success("Resumen copiado al portapapeles"))
              .catch(() => toast.info("Copia manualmente el resumen mostrado"))
              .finally(() => setGenerando(false));
          }}
        >
          {generando ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />} Copiar resumen
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metrica
            etiqueta="PA media 30 días"
            valor={sistolica && diastolica ? `${numero(sistolica)}/${numero(diastolica)}` : "—"}
            unidad="mmHg"
          />
          <Metrica etiqueta="UF media" valor={uf ? numero(uf) : "—"} unidad="ml" />
          <Metrica etiqueta="Peso medio" valor={peso ? numero(peso, 1) : "—"} unidad="kg" />
          <Metrica etiqueta="Gasto del mes" valor={bolivianos(gastoMes)} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen clínico (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <FilaDato etiqueta="Paciente" valor={paciente?.nombre ?? "—"} />
            <FilaDato etiqueta="Diagnóstico" valor={paciente?.diagnostico_principal ?? "—"} />
            <FilaDato etiqueta="Modalidad" valor={paciente?.modalidad_dialisis ?? "—"} />
            <FilaDato etiqueta="Sesiones registradas" valor={sesiones?.length ?? 0} />
            <FilaDato etiqueta="Registros de constantes" valor={constantes?.length ?? 0} />
            <FilaDato etiqueta="Alertas activas" valor={alertas?.length ?? 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parámetros de laboratorio fuera de rango</CardTitle>
          </CardHeader>
          <CardContent>
            {fueraRango.length ? (
              fueraRango.map((r) => (
                <FilaDato
                  key={r.id}
                  etiqueta={`${r.parametro} · ${fechaCorta(r.fecha)}`}
                  valor={`${r.valor != null ? numero(r.valor, 2) : (r.valor_texto ?? "—")} ${r.unidad ?? ""}`}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Todos los parámetros recientes están en rango.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Texto del informe</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed">
              {texto}
            </pre>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
