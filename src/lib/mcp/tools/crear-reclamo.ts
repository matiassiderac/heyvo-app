import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorTexto, perfilDelUsuario, textoJson } from "../perfil";
import { supabaseForUser } from "../supabase";

const slaHoras: Record<string, number> = { alta: 4, media: 24, baja: 72 };

export default defineTool({
  name: "crear_reclamo",
  title: "Crear reclamo",
  description:
    "Crea un reclamo en el consorcio de la persona autenticada, con su unidad y el vencimiento de SLA según la prioridad.",
  inputSchema: {
    titulo: z.string().trim().min(3).describe("Título corto del reclamo."),
    categoria: z
      .string()
      .trim()
      .min(2)
      .describe("Categoría, por ejemplo: plomería, electricidad, ascensores, limpieza."),
    descripcion: z.string().trim().min(3).describe("Detalle de lo que pasa."),
    prioridad: z.enum(["alta", "media", "baja"]).default("media"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ titulo, categoria, descripcion, prioridad }, ctx) => {
    if (!ctx.isAuthenticated()) return errorTexto("No autenticado.");
    const perfil = await perfilDelUsuario(ctx);
    if (!perfil) return errorTexto("Tu cuenta todavía no está vinculada a una unidad.");

    const supabase = supabaseForUser(ctx);
    const ahora = new Date();
    const prio = prioridad ?? "media";
    const vence = new Date(ahora.getTime() + (slaHoras[prio] ?? 24) * 3600 * 1000);
    const codigo = `TK-${ahora.getTime().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        codigo,
        consorcio_id: perfil.consorcioId,
        unidad_id: perfil.unidadId,
        unidad_etiqueta: perfil.unidadEtiqueta,
        creado_por: ctx.getUserId() ?? null,
        titulo,
        categoria,
        descripcion,
        prioridad: prio,
        estado: "nuevo",
        canal: "app",
        vence_at: vence.toISOString(),
      })
      .select("id, codigo, titulo, estado, prioridad, vence_at")
      .single();
    if (error) return errorTexto(error.message);

    await supabase.from("ticket_eventos").insert({
      ticket_id: data.id,
      autor: ctx.getUserId() ?? null,
      texto: "Reclamo creado desde un asistente conectado a HEYVO.",
    });

    return { ...textoJson(data), structuredContent: { reclamo: data } };
  },
});
