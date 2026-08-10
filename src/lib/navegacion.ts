import {
  Activity,
  Apple,
  Bot,
  CalendarDays,
  Droplets,
  FileText,
  HandHeart,
  HeartPulse,
  LayoutDashboard,
  LayoutGrid,
  MonitorSmartphone,
  Package,
  Pill,
  Receipt,
  Stethoscope,
  Users,
  Watch,
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
    to: "/nutricion",
    label: "Nutrición e hidratación",
    corto: "Nutrición",
    icon: Apple,
    descripcion: "Restricción hídrica, potasio, fósforo y proteínas",
    grupo: "clinico",
  },
  {
    to: "/monitorizacion",
    label: "Monitorización continua",
    corto: "Monitor",
    icon: Activity,
    descripcion: "Tendencias y umbrales de vigilancia",
    grupo: "clinico",
  },
  {
    to: "/historial",
    label: "Línea de tiempo clínica",
    corto: "Historial",
    icon: Stethoscope,
    descripcion: "Ingresos, diagnósticos y evolución",
    grupo: "clinico",
  },
  {
    to: "/documentos",
    label: "Documentos y analíticas",
    corto: "Documentos",
    icon: FileText,
    descripcion: "Informes, laboratorio y lectura OCR",
    grupo: "gestion",
  },
  {
    to: "/inventario",
    label: "Inventario CNS",
    corto: "Inventario",
    icon: Package,
    descripcion: "Suministros, lotes, caducidades y entregas",
    grupo: "gestion",
  },
  {
    to: "/gastos",
    label: "Gastos",
    corto: "Gastos",
    icon: Receipt,
    descripcion: "Control económico en bolivianos",
    grupo: "gestion",
  },
  {
    to: "/informes",
    label: "Informes",
    corto: "Informes",
    icon: FileText,
    descripcion: "Resúmenes para consulta médica",
    grupo: "gestion",
  },
  {
    to: "/wearable",
    label: "Dispositivos (wearable)",
    corto: "Wearable",
    icon: Watch,
    descripcion: "Device Connector desacoplado, sin conexión activa",
    grupo: "gestion",
  },
  {
    to: "/directorio",
    label: "Directorio asistencial",
    corto: "Directorio",
    icon: Users,
    descripcion: "Médicos, enfermería, familia y emergencias",
    grupo: "asistencia",
  },
  {
    to: "/enfermeria",
    label: "Modo enfermería",
    corto: "Enfermería",
    icon: MonitorSmartphone,
    descripcion: "Turno, checklist y registro rápido",
    grupo: "asistencia",
  },
  {
    to: "/cuidador",
    label: "Panel del cuidador",
    corto: "Cuidador",
    icon: HandHeart,
    descripcion: "Tareas del día, relevos y notas",
    grupo: "asistencia",
  },
  {
    to: "/asistente",
    label: "Asistente IA",
    corto: "Asistente",
    icon: Bot,
    descripcion: "Consultas sobre el historial de la paciente",
    grupo: "asistencia",
  },
  {
    to: "/paciente",
    label: "Ficha de la paciente",
    corto: "Ficha",
    icon: IdCard,
    descripcion: "Datos personales, contacto, diagnóstico y preferencias",
    grupo: "gestion",
  },
  {
    to: "/perfil",
    label: "Mi perfil",
    corto: "Perfil",
    icon: UserCircle,
    descripcion: "Tus datos de contacto y tu acceso",
    grupo: "asistencia",
  },
  {
    to: "/usuarios",
    label: "Usuarios y accesos",
    corto: "Usuarios",
    icon: ShieldCheck,
    descripcion: "Roles, aprobaciones y estado de cuenta (administración)",
    grupo: "asistencia",
  },
];


export const NAV_MOVIL = ["/inicio", "/agenda", "/salud", "/dialisis"];

export const MAS_ITEM = {
  to: "/mas",
  corto: "Más",
  icon: LayoutGrid,
};
