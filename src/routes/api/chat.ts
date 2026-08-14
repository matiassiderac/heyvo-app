import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import {
  amenities,
  boletas,
  contactos,
  documentos,
  faqs,
  avisos,
  slaHoras,
  tickets,
  tiposCertificado,
  formatARS,
} from "@/data/demo";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      const response = await fetch(input, { ...init, headers });
      runId = response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || runId;
      return response;
    },
  };
}

type Contexto = {
  rol?: string;
  unidad?: string;
  consorcio?: string;
  saldo?: number;
  ticketsAbiertos?: number;
};

const sistema = (ctx: Contexto) => `
Sos el asistente virtual de HEYVO, la plataforma de administración de consorcios.

Voz de marca (obligatoria):
- Hablás en español rioplatense, de vos, en presente y en positivo.
- Frases cortas, concretas y amables. Nada de lenguaje de expediente ni de trámite.
- Ejemplo de tono: "Tu reclamo quedó registrado. Te aviso apenas haya novedades."
- No uses emojis salvo que la persona los use primero.

Quién te está escribiendo:
- Rol: ${ctx.rol ?? "residente"}
- Unidad: ${ctx.unidad ?? "4° B"} de ${ctx.consorcio ?? "Edificio Rivadavia 2450"}
- Saldo de expensas pendiente: ${formatARS(ctx.saldo ?? 0)}
- Reclamos abiertos: ${ctx.ticketsAbiertos ?? 0}

Cómo trabajás:
- Entendés lenguaje libre, jerga argentina, errores de tipeo y audios transcriptos.
- Usá las herramientas para consultar datos reales del prototipo antes de responder.
  Nunca inventes montos, fechas, números de ticket ni reglas.
- Para acciones que cambian algo (crear un reclamo, reservar un espacio común, pedir un
  certificado, registrar una mudanza) usá "proponer_accion": la persona confirma en
  pantalla y recién ahí se ejecuta. No digas que ya lo hiciste antes de la confirmación.
- Si falta un dato para proponer la acción, pedí solo lo que falta, de a una cosa por vez.

Emergencias (prioridad máxima):
- Si detectás olor a gas, fuego o humo, personas atrapadas en el ascensor, inundación
  fuerte o riesgo eléctrico, cortá cualquier otro tema y usá "protocolo_emergencia".
- Aclarale siempre que HEYVO no es un servicio de emergencias y que llame al número que
  corresponde.

Límites:
- Un inquilino no puede pedir certificados reservados al propietario: explicalo con
  claridad, sin dar datos de otras personas ni de otras unidades.
- Solo ves la unidad de esta sesión.
- Si el tema no es del consorcio, decilo y ofrecé derivar a la administración.
- Estás en un prototipo: los pagos, los envíos y las integraciones son simulados.

Respondé en markdown liviano: párrafos cortos y listas cuando sumen.
`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          contexto?: Contexto;
        };
        if (!Array.isArray(body.messages)) {
          return new Response("Faltan los mensajes", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("Falta LOVABLE_API_KEY", { status: 500 });
        }

        const initialRunId =
          request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
        const runIdFetch = createRunIdFetch(initialRunId);

        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        const herramientas = {
          consultar_expensas: tool({
            description:
              "Devuelve las boletas de expensas de la unidad con su estado, vencimiento y detalle.",
            inputSchema: z.object({
              periodo: z
                .string()
                .nullable()
                .describe("Período puntual, por ejemplo 'Julio 2026'. Null para todas."),
            }),
            execute: async ({ periodo }) => {
              const lista = periodo
                ? boletas.filter((b) =>
                    b.periodo.toLowerCase().includes(periodo.toLowerCase()),
                  )
                : boletas;
              return lista.map((b) => ({
                id: b.id,
                periodo: b.periodo,
                estado: b.estado,
                vencimiento: b.vencimiento,
                total: b.total,
                interes: b.interes ?? 0,
                detalle: b.detalle,
              }));
            },
          }),
          consultar_reclamos: tool({
            description:
              "Lista los reclamos del consorcio con su estado, prioridad y SLA, o busca uno por número de ticket.",
            inputSchema: z.object({
              ticketId: z
                .string()
                .nullable()
                .describe("Número de ticket, por ejemplo TK-1042. Null para listar."),
            }),
            execute: async ({ ticketId }) => {
              const lista = ticketId
                ? tickets.filter(
                    (t) => t.id.toLowerCase() === ticketId.toLowerCase().trim(),
                  )
                : tickets;
              return {
                sla: slaHoras,
                tickets: lista.map((t) => ({
                  id: t.id,
                  titulo: t.titulo,
                  estado: t.estado,
                  prioridad: t.prioridad,
                  categoria: t.categoria,
                  unidad: t.unidad,
                  vence: t.vence,
                  asignadoA: t.asignadoA ?? null,
                  historial: t.historial,
                })),
              };
            },
          }),
          consultar_espacios_comunes: tool({
            description:
              "Devuelve los espacios comunes reservables, sus reglas y las franjas horarias disponibles.",
            inputSchema: z.object({
              amenityId: z.string().nullable().describe("Id del espacio o null para todos."),
            }),
            execute: async ({ amenityId }) =>
              amenityId ? amenities.filter((a) => a.id === amenityId) : amenities,
          }),
          buscar_avisos_y_documentos: tool({
            description:
              "Busca en avisos, comunicados, documentos del consorcio y preguntas frecuentes.",
            inputSchema: z.object({
              consulta: z.string().describe("Texto libre a buscar."),
            }),
            execute: async ({ consulta }) => {
              const q = consulta.toLowerCase();
              const coincide = (texto: string) =>
                texto.toLowerCase().includes(q) || q.length < 3;
              return {
                avisos: avisos.filter((a) => coincide(a.titulo + " " + a.cuerpo)),
                documentos: documentos.filter((d) => coincide(d.nombre + d.categoria)),
                faqs: faqs.filter((f) => coincide(f.pregunta + f.respuesta)),
              };
            },
          }),
          consultar_certificados: tool({
            description:
              "Devuelve los certificados y constancias que se pueden pedir, con demora y si son solo para propietarios.",
            inputSchema: z.object({}),
            execute: async () => tiposCertificado,
          }),
          protocolo_emergencia: tool({
            description:
              "Devuelve las instrucciones y los teléfonos para una situación de riesgo. Usalo apenas detectes gas, fuego, humo, personas en el ascensor, inundación o riesgo eléctrico.",
            inputSchema: z.object({
              tipo: z
                .enum(["gas", "incendio", "ascensor", "inundacion", "electricidad", "otro"])
                .describe("Tipo de emergencia detectada."),
            }),
            execute: async ({ tipo }) => ({
              tipo,
              aviso:
                "HEYVO no es un servicio de emergencias. Llamá al número que corresponde antes que nada.",
              pasos: {
                gas: [
                  "No prendas luces ni uses el ascensor.",
                  "Abrí puertas y ventanas.",
                  "Salí del departamento y llamá a la guardia de gas.",
                ],
                incendio: [
                  "Salí por la escalera, nunca por el ascensor.",
                  "Llamá a bomberos al 100.",
                  "Avisá al encargado si podés hacerlo sin riesgo.",
                ],
                ascensor: [
                  "Mantené la calma y usá el botón de alarma.",
                  "Llamá a la guardia de ascensores.",
                  "No intentes abrir las puertas por la fuerza.",
                ],
                inundacion: [
                  "Cortá la electricidad del sector si es seguro.",
                  "Cerrá la llave de paso de agua.",
                  "Avisá al encargado y a la administración.",
                ],
                electricidad: [
                  "No toques cables ni tableros mojados.",
                  "Bajá la térmica del sector si podés.",
                  "Llamá a la guardia eléctrica.",
                ],
                otro: ["Alejate del riesgo.", "Llamá al 911."],
              }[tipo],
              telefonos: contactos.filter((c) => c.urgente),
            }),
          }),
          proponer_accion: tool({
            description:
              "Propone una acción que cambia datos (crear un reclamo, reservar un espacio común, pedir un certificado, registrar una mudanza o pagar una boleta). La persona la confirma en pantalla.",
            inputSchema: z.object({
              tipo: z.enum([
                "crear_reclamo",
                "reservar_espacio",
                "pedir_certificado",
                "registrar_mudanza",
                "pagar_expensas",
              ]),
              resumen: z
                .string()
                .describe("Una línea que describe qué se va a hacer, en segunda persona."),
              datos: z
                .object({
                  titulo: z.string().nullable(),
                  categoria: z.string().nullable(),
                  descripcion: z.string().nullable(),
                  prioridad: z.enum(["alta", "media", "baja"]).nullable(),
                  amenityId: z.string().nullable(),
                  fecha: z.string().nullable(),
                  franja: z.string().nullable(),
                  certificadoId: z.string().nullable(),
                  tipoMudanza: z.enum(["mudanza", "flete", "obra"]).nullable(),
                  boletaId: z.string().nullable(),
                })
                .describe("Campos de la acción. Poné null en los que no apliquen."),
            }),
            execute: async (input) => ({ ...input, estado: "pendiente_de_confirmacion" }),
          }),
        };

        const result = streamText({
          model: lovable.responses("openai/gpt-5.6-sol"),
          system: sistema(body.contexto ?? {}),
          messages: await convertToModelMessages(body.messages),
          tools: herramientas,
          stopWhen: stepCountIs(50),
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages,
          sendReasoning: true,
          onError: (error) => {
            console.error("[heyvo/chat]", error);
            const mensaje = error instanceof Error ? error.message : String(error);
            if (mensaje.includes("429"))
              return "Estamos recibiendo muchos mensajes. Probá de nuevo en un minuto.";
            if (mensaje.includes("402"))
              return "El asistente se quedó sin créditos. Avisale al equipo de HEYVO.";
            return "No pude responder ese mensaje. Probá de nuevo en unos segundos.";
          },
        });
      },
    },
  },
});
