import { defineTool } from "@lovable.dev/mcp-js";

import { errorTexto, perfilDelUsuario, textoJson } from "../perfil";

export default defineTool({
  name: "mi_perfil",
  title: "Mi perfil y unidad",
  description:
    "Devuelve el consorcio, la unidad y el rol de la persona autenticada en HEYVO.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errorTexto("No autenticado.");
    const perfil = await perfilDelUsuario(ctx);
    if (!perfil) return errorTexto("Tu cuenta todavía no está vinculada a una unidad.");
    return textoJson(perfil);
  },
});
