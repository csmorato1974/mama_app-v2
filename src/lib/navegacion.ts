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
];

export const NAV_MOVIL = ["/inicio", "/agenda", "/salud"];
