import {
  Activity,
  Bot,
  CalendarDays,
  ClipboardList,
  Droplets,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Package,
  Pill,
  Receipt,
  Siren,
  Stethoscope,
  Users,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  corto: string;
  icon: typeof Activity;
  descripcion: string;
  grupo: "clinico" | "gestion" | "asistencia";
};

export const NAV: NavItem[] = [
  {
    to: "/inicio",
    label: "Resumen de hoy",
    corto: "Inicio",
    icon: LayoutDashboard,
    descripcion: "Estado general, alertas y tareas del día",
    grupo: "clinico",
  },
  {
    to: "/agenda",
    label: "Agenda",
    corto: "Agenda",
    icon: CalendarDays,
    descripcion: "Consultas, análisis, entregas y recordatorios",
    grupo: "clinico",
  },
  {
    to: "/salud",
    label: "Constantes",
    corto: "Salud",
    icon: HeartPulse,
    descripcion: "Presión, peso, saturación, síntomas y balance",
    grupo: "clinico",
  },
  {
    to: "/dialisis",
    label: "Diálisis peritoneal",
    corto: "Diálisis",
    icon: Droplets,
    descripcion: "Intercambios, ultrafiltración e incidencias",
    grupo: "clinico",
  },
  {
    to: "/medicacion",
    label: "Medicación",
    corto: "Medicación",
    icon: Pill,
    descripcion: "Tratamiento activo, tomas y cambios",
    grupo: "clinico",
  },
  {
    to: "/analiticas",
    label: "Analíticas",
    corto: "Labs",
    icon: FlaskConical,
    descripcion: "Resultados de laboratorio y evolución",
    grupo: "clinico",
  },
  {
    to: "/documentos",
    label: "Documentos",
    corto: "Docs",
    icon: FileText,
    descripcion: "Informes, recetas y lectura automática",
    grupo: "clinico",
  },
  {
    to: "/historial",
    label: "Historial clínico",
    corto: "Historial",
    icon: ClipboardList,
    descripcion: "Línea de tiempo de la enfermedad",
    grupo: "clinico",
  },
  {
    to: "/inventario",
    label: "Inventario CNS",
    corto: "Inventario",
    icon: Package,
    descripcion: "Suministros de diálisis y material",
    grupo: "gestion",
  },
  {
    to: "/gastos",
    label: "Gastos",
    corto: "Gastos",
    icon: Receipt,
    descripcion: "Control económico del cuidado",
    grupo: "gestion",
  },
  {
    to: "/informes",
    label: "Informes",
    corto: "Informes",
    icon: Activity,
    descripcion: "Resúmenes para consultas médicas",
    grupo: "gestion",
  },
  {
    to: "/alertas",
    label: "Alertas",
    corto: "Alertas",
    icon: Siren,
    descripcion: "Reglas de vigilancia y avisos activos",
    grupo: "gestion",
  },
  {
    to: "/directorio",
    label: "Directorio",
    corto: "Contactos",
    icon: Users,
    descripcion: "Equipo médico, familia y proveedores",
    grupo: "asistencia",
  },
  {
    to: "/asistente",
    label: "Asistente IA",
    corto: "Asistente",
    icon: Bot,
    descripcion: "Preguntas sobre el estado y los registros",
    grupo: "asistencia",
  },
  {
    to: "/enfermeria",
    label: "Modo enfermería",
    corto: "Enfermería",
    icon: Stethoscope,
    descripcion: "Turno simplificado para el personal",
    grupo: "asistencia",
  },
];

export const NAV_MOVIL = ["/inicio", "/agenda", "/salud", "/dialisis"];
