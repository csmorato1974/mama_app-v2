import { useQuery } from "@tanstack/react-query";

import { calcularAlertas } from "@/lib/alertas";
import {
  useActividades,
  useConstantes,
  useInventario,
  useLaboratorio,
  useReglasAlerta,
  useSesionesDialisis,
} from "@/hooks/useCuidados";

export function useAlertas() {
  const reglas = useReglasAlerta();
  const constantes = useConstantes(10);
  const sesiones = useSesionesDialisis(10);
  const laboratorio = useLaboratorio();
  const inventario = useInventario();
  const actividades = useActividades();

  const listo =
    reglas.data && constantes.data && sesiones.data && laboratorio.data && inventario.data && actividades.data;

  return useQuery({
    queryKey: [
      "alertas",
      reglas.dataUpdatedAt,
      constantes.dataUpdatedAt,
      sesiones.dataUpdatedAt,
      laboratorio.dataUpdatedAt,
      inventario.dataUpdatedAt,
      actividades.dataUpdatedAt,
    ],
    enabled: Boolean(listo),
    queryFn: () =>
      calcularAlertas({
        reglas: reglas.data!,
        constantes: constantes.data!,
        sesiones: sesiones.data!,
        laboratorio: laboratorio.data!,
        inventario: inventario.data!,
        actividades: actividades.data!,
      }),
  });
}
