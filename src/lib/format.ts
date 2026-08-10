import { format, formatDistanceToNowStrict, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = value.includes("T") ? parseISO(value) : parseISO(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function fechaCorta(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, "d MMM", { locale: es }) : "—";
}

export function fechaLarga(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, "d 'de' MMMM 'de' yyyy", { locale: es }) : "—";
}

export function fechaHora(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, "d MMM · HH:mm", { locale: es }) : "—";
}

export function hora(value: string | Date | null | undefined) {
  if (!value) return "—";
  if (typeof value === "string" && !value.includes("T")) return value.slice(0, 5);
  const d = toDate(value);
  return d ? format(d, "HH:mm") : "—";
}

export function fechaRelativa(value: string | Date | null | undefined) {
  const d = toDate(value);
  if (!d) return "—";
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  return `hace ${formatDistanceToNowStrict(d, { locale: es })}`;
}

const bs = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  maximumFractionDigits: 0,
});

export function bolivianos(value: number | null | undefined) {
  return bs.format(value ?? 0).replace("BOB", "Bs");
}

export function numero(value: number | null | undefined, decimales = 0) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-BO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

export function edadDesde(fechaNacimiento: string | null | undefined) {
  const d = toDate(fechaNacimiento);
  if (!d) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad -= 1;
  return edad;
}

export function iniciales(nombre: string | null | undefined) {
  if (!nombre) return "—";
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function capitalizar(texto: string | null | undefined) {
  if (!texto) return "—";
  const limpio = texto.replace(/_/g, " ");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export const ISO_HOY = () => format(new Date(), "yyyy-MM-dd");
