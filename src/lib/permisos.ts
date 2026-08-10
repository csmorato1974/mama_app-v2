import type { Rol } from "@/hooks/useSesion";

export const ROLES: Rol[] = ["administrador", "familiar", "enfermeria", "medico", "lectura"];

export const ROLES_ESCRITURA: Rol[] = ["administrador", "familiar", "enfermeria", "medico"];

export const ETIQUETA_ROL: Record<Rol, string> = {
  administrador: "Administrador",
  familiar: "Familiar",
  enfermeria: "Enfermería",
  medico: "Médico",
  lectura: "Solo lectura",
};

export function esAdministrador(roles: Rol[]) {
  return roles.includes("administrador");
}

/** Solo administración gestiona usuarios, roles y aprobaciones. */
export function puedeGestionarUsuarios(roles: Rol[]) {
  return esAdministrador(roles);
}

/** La ficha de la paciente la editan los roles operativos. */
export function puedeEditarPaciente(roles: Rol[]) {
  return roles.some((r) => ROLES_ESCRITURA.includes(r));
}

/** Cada persona edita su propio perfil; administración puede editar cualquiera. */
export function puedeEditarPerfil(roles: Rol[], actorId: string | null, objetivoId: string) {
  if (!actorId) return false;
  return actorId === objetivoId || esAdministrador(roles);
}

/** Roles y estado de acceso nunca son editables por quien no es administrador. */
export function puedeCambiarRol(roles: Rol[]) {
  return esAdministrador(roles);
}

/** Campos del perfil que puede tocar cada tipo de usuario. */
export function camposPerfilEditables(roles: Rol[]): string[] {
  const propios = ["nombre", "telefono", "correo", "relacion", "avatar_url"];
  return esAdministrador(roles) ? [...propios, "activo", "aprobado"] : propios;
}

/** Campos modificados para el registro de auditoría. */
export function camposModificados<T extends Record<string, unknown>>(antes: T, despues: Partial<T>) {
  return Object.keys(despues).filter(
    (clave) => (antes[clave] ?? null) !== ((despues as Record<string, unknown>)[clave] ?? null),
  );
}

export function validarPerfil(valores: { nombre: string; telefono?: string; correo?: string }) {
  const errores: Record<string, string> = {};
  if (valores.nombre.trim().length < 3) errores['nombre'] = "Indica nombre y apellido (mínimo 3 caracteres).";
  if (valores.nombre.trim().length > 120) errores['nombre'] = "Máximo 120 caracteres.";
  if (valores.telefono && !/^[+\d\s()-]{6,20}$/.test(valores.telefono.trim()))
    errores['telefono'] = "Teléfono no válido.";
  if (valores.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.correo.trim()))
    errores['correo'] = "Correo no válido.";
  return errores;
}

export function validarPaciente(valores: {
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  peso_seco?: string | null;
}) {
  const errores: Record<string, string> = {};
  if (valores.nombre.trim().length < 3) errores['nombre'] = "El nombre es obligatorio.";
  if (valores.telefono && !/^[+\d\s()-]{6,20}$/.test(valores.telefono.trim()))
    errores['telefono'] = "Teléfono no válido.";
  if (valores.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.correo.trim()))
    errores['correo'] = "Correo no válido.";
  if (valores.peso_seco) {
    const peso = Number(valores.peso_seco);
    if (!Number.isFinite(peso) || peso <= 0 || peso > 300) errores['peso_seco'] = "Peso seco entre 1 y 300 kg.";
  }
  return errores;
}

/** Mensaje genérico de recuperación: nunca revela si el correo existe. */
export const MENSAJE_RECUPERACION =
  "Si el correo está vinculado a una cuenta, recibirás un enlace de recuperación válido por tiempo limitado y de un solo uso.";
