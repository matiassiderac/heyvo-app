import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { errorTexto, textoJson } from "../perfil";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_expensas",
  title: "Listar expensas",
  description:
    "Lista las boletas de expensas visibles para la persona autenticada, con período, vencimiento, total, interés y estado.",
  inputSchema: {
    estado: z
      .enum(["pendiente", "paga", "vencida"])
      .optional()
      .describe("Filtro opcional por estado de la boleta."),
    limite: z.number().int().min(1).max(50).default(12).describe("Cantidad máxima de boletas."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ estado, limite }, ctx) => {
    if (!ctx.isAuthenticated()) return errorTexto("No autenticado.");
    const supabase = supabaseForUser(ctx);
    let consulta = supabase
      .from("boletas")
      .select("id, periodo, vencimiento, total, interes, estado, unidades(etiqueta)")
      .order("vencimiento", { ascending: false })
      .limit(limite ?? 12);
    if (estado) consulta = consulta.eq("estado", estado);
    const { data, error } = await consulta;
    if (error) return errorTexto(error.message);
    const boletas = (data ?? []).map((b) => ({
      id: b.id,
      periodo: b.periodo,
      vencimiento: b.vencimiento,
      total: Number(b.total),
      interes: Number(b.interes ?? 0),
      estado: b.estado,
      unidad: (b.unidades as { etiqueta: string } | null)?.etiqueta ?? null,
    }));
    return { ...textoJson(boletas), structuredContent: { boletas } };
  },
});
