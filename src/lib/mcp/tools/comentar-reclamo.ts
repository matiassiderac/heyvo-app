import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorTexto, textoJson } from "../perfil";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "comentar_reclamo",
  title: "Comentar un reclamo",
  description: "Agrega un comentario al historial de un reclamo visible para la persona autenticada.",
  inputSchema: {
    reclamo_id: z.string().uuid().describe("ID del reclamo (campo id de listar_reclamos)."),
    texto: z.string().trim().min(2).describe("Comentario a agregar al historial."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ reclamo_id, texto }, ctx) => {
    if (!ctx.isAuthenticated()) return errorTexto("No autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("ticket_eventos")
      .insert({ ticket_id: reclamo_id, autor: ctx.getUserId() ?? null, texto })
      .select("id, ticket_id, texto, created_at")
      .single();
    if (error) return errorTexto(error.message);
    return { ...textoJson(data), structuredContent: { evento: data } };
  },
});
