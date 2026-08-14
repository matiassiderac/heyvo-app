import type { ToolContext } from "@lovable.dev/mcp-js";

import { supabaseForUser } from "./supabase";

export type PerfilHeyvo = {
  personaId: string;
  nombre: string;
  rol: string;
  unidadId: string | null;
  unidadEtiqueta: string | null;
  consorcioId: string;
  consorcioNombre: string | null;
  consorcioDireccion: string | null;
};

/** Perfil vinculado del usuario autenticado; null si su cuenta no está vinculada a una unidad. */
export async function perfilDelUsuario(ctx: ToolContext): Promise<PerfilHeyvo | null> {
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase
    .from("personas")
    .select("id, nombre, rol, unidad_id, consorcio_id, unidades(etiqueta), consorcios(nombre, direccion)")
    .eq("user_id", ctx.getUserId() ?? "")
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const unidad = data.unidades as { etiqueta: string } | null;
  const consorcio = data.consorcios as { nombre: string; direccion: string | null } | null;
  return {
    personaId: data.id,
    nombre: data.nombre,
    rol: data.rol,
    unidadId: data.unidad_id,
    unidadEtiqueta: unidad?.etiqueta ?? null,
    consorcioId: data.consorcio_id,
    consorcioNombre: consorcio?.nombre ?? null,
    consorcioDireccion: consorcio?.direccion ?? null,
  };
}

export function textoJson(valor: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(valor, null, 2) }] };
}

export function errorTexto(mensaje: string) {
  return { content: [{ type: "text" as const, text: mensaje }], isError: true };
}
