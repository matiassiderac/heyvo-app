import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorTexto, textoJson } from "../perfil";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_reclamos",
  title: "Listar reclamos",
  description:
    "Lista los reclamos (tickets) visibles para la persona autenticada, con estado, prioridad, vencimiento del SLA e historial.",
  inputSchema: {
    estado: z
      .enum(["nuevo", "en_curso", "resuelto", "cerrado", "reabierto"])
      .optional()
      .describe("Filtro opcional por estado del reclamo."),
    limite: z.number().int().min(1).max(50).default(15).describe("Cantidad máxima de reclamos."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ estado, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return errorTexto("No autenticado.");
    const supabase = supabaseForUser(ctx);
    let consulta = supabase
      .from("tickets")
      .select(
        "id, codigo, titulo, categoria, descripcion, prioridad, estado, unidad_etiqueta, canal, csat, created_at, vence_at, ticket_eventos(texto, created_at)",
      )
      .order("created_at", { ascending: false })
      .limit(limite ?? 15);
    if (estado) consulta = consulta.eq("estado", estado);
    const { data, error } = await consulta;
    if (error) return errorTexto(error.message);
    const reclamos = (data ?? []).map((t) => ({
      id: t.id,
      codigo: t.codigo,
      titulo: t.titulo,
      categoria: t.categoria,
      descripcion: t.descripcion,
      prioridad: t.prioridad,
      estado: t.estado,
      unidad: t.unidad_etiqueta,
      canal: t.canal,
      csat: t.csat,
      creado: t.created_at,
      vence: t.vence_at,
      historial: ((t.ticket_eventos ?? []) as { texto: string; created_at: string }[])
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((e) => ({ fecha: e.created_at, texto: e.texto })),
    }));
    return { ...textoJson(reclamos), structuredContent: { reclamos } };
  },
});
