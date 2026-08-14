import { auth, defineMcp } from "@lovable.dev/mcp-js";

import comentarReclamo from "./tools/comentar-reclamo";
import crearReclamo from "./tools/crear-reclamo";
import listarExpensas from "./tools/listar-expensas";
import listarReclamos from "./tools/listar-reclamos";
import miPerfil from "./tools/mi-perfil";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "heyvo",
  title: "HEYVO",
  version: "0.1.0",
  instructions:
    "Herramientas de HEYVO, la plataforma de administración de consorcios. Usá mi_perfil para saber a qué consorcio y unidad pertenece la persona, listar_expensas para sus boletas, listar_reclamos para el estado de sus reclamos, crear_reclamo para abrir uno nuevo y comentar_reclamo para sumar información. Todo responde en español rioplatense y solo devuelve datos de la persona autenticada.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    miPerfil,
    listarExpensas,
    listarReclamos,
    crearReclamo,
    comentarReclamo,
  ] as unknown as Parameters<typeof defineMcp>[0]["tools"],
});
