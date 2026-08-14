import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Headset, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Isotipo } from "@/components/heyvo/marca";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { tiposCertificado } from "@/data/demo";
import { useCertificados } from "@/lib/certificados";
import { useDemo } from "@/lib/demo-session";
import { useMiConversacion } from "@/lib/conversaciones";
import { cn } from "@/lib/utils";

const sugerencias = [
  "¿Cuánto debo de expensas?",
  "Se tapó la pileta de la cocina",
  "Quiero reservar el SUM para el sábado",
  "¿En qué anda el reclamo del agua?",
  "Necesito el libre deuda",
  "Huelo a gas en el palier",
];

type AccionPropuesta = {
  tipo:
    | "crear_reclamo"
    | "reservar_espacio"
    | "pedir_certificado"
    | "registrar_mudanza"
    | "pagar_expensas";
  resumen: string;
  datos: Record<string, string | null>;
};

/** Se define una sola vez: si cambia la identidad del array, useChat reinicia el hilo. */
const MENSAJES_INICIALES: UIMessage[] = [
  {
    id: "bienvenida",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "Hola, soy el asistente de HEYVO. Contame qué necesitás con tus palabras: expensas, un reclamo, una reserva, documentos o lo que se te ocurra del edificio.",
      },
    ],
  } as UIMessage,
];


export function AsistenteChat() {
  const demo = useDemo();
  const { pedir: pedirCertificado } = useCertificados();
  const {
    conversacion,
    mensajes: mensajesHumanos,
    registrarMensaje,
    derivar,
    derivando,
    cerrarPropia,
    cerrando,
  } = useMiConversacion();
  const [derivaciones, setDerivaciones] = useState<Record<string, boolean>>({});
  const [texto, setTexto] = useState("");
  /** Hilo con la administración: se mantiene visible aunque la conversación se cierre. */
  const [historialHumano, setHistorialHumano] = useState<
    { id: string; texto: string; fecha: string; mio: boolean }[]
  >([]);
  /** Índice del hilo del bot donde arrancó el handoff: todo lo nuevo va debajo. */
  const [corteHandoff, setCorteHandoff] = useState<number | null>(null);
  const [aplicadas, setAplicadas] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  const contexto = useMemo(
    () => ({
      rol: demo.rol,
      unidad: demo.sesion?.unidadEtiqueta ?? "sin unidad asignada",
      consorcio: demo.sesion?.consorcioNombre ?? "sin consorcio",
      saldo: demo.boletas
        .filter((b) => b.estado !== "paga")
        .reduce((a, b) => a + b.total + (b.interes ?? 0), 0),
      ticketsAbiertos: demo.tickets.filter(
        (t) => !["cerrado", "resuelto"].includes(t.estado),
      ).length,
      datos: {
        boletas: demo.boletas.map((b) => ({
          id: b.id,
          periodo: b.periodo,
          estado: b.estado,
          vencimiento: b.vencimiento,
          total: b.total,
          interes: b.interes ?? 0,
          detalle: b.detalle,
        })),
        tickets: demo.tickets.map((t) => ({
          id: t.id,
          titulo: t.titulo,
          estado: t.estado,
          prioridad: t.prioridad,
          categoria: t.categoria,
          unidad: t.unidad,
          vence: t.vence,
          historial: t.historial,
        })),
        amenities: demo.amenities,
        avisos: demo.avisos.map((a) => ({
          id: a.id,
          titulo: a.titulo,
          cuerpo: a.cuerpo,
          tipo: a.tipo,
          fecha: a.fecha,
        })),
      },
    }),
    [demo.rol, demo.boletas, demo.tickets, demo.amenities, demo.avisos, demo.sesion],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, contexto },
        }),
      }),
    [contexto],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: ({ message }) => {
      const texto = message.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n")
        .trim();
      if (texto) void registrarMensaje({ autor: "asistente", texto }).catch(() => undefined);
    },
    messages: MENSAJES_INICIALES,
  });

  const cargando = status === "submitted" || status === "streaming";

  /**
   * Handoff activo: la conversación está en manos del equipo humano.
   * Mientras dure, el asistente queda muteado y NO se llama al LLM.
   */
  const enHandoff =
    conversacion?.estado === "esperando_humano" || conversacion?.estado === "humano";

  useEffect(() => {
    // Sumamos las respuestas del operador al historial y las dejamos visibles
    // aunque después la conversación se cierre.
    const nuevos = mensajesHumanos
      .filter((m) => m.autor === "operador")
      .map((m) => ({ id: m.id, texto: m.texto, fecha: m.fecha, mio: false }));
    if (nuevos.length === 0) return;
    setHistorialHumano((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const faltantes = nuevos.filter((n) => !ids.has(n.id));
      if (faltantes.length === 0) return prev;
      return [...prev, ...faltantes].sort((a, b) => a.fecha.localeCompare(b.fecha));
    });
  }, [mensajesHumanos]);

  useEffect(() => {
    // Al cerrar no se vacía ningún estado: conservamos el corte y el hilo humano.
    // La conversación cerrada sigue siendo consultable y sus mensajes permanecen montados.
    if (conversacion?.estado === "cerrada" && corteHandoff === null) {
      setCorteHandoff(messages.length);
    }
  }, [conversacion?.estado, corteHandoff, messages.length]);

  useEffect(() => {
    if (enHandoff) setCorteHandoff((prev) => prev ?? messages.length);
  }, [enHandoff, messages.length]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, cargando]);

  useEffect(() => {
    if (!cargando) inputRef.current?.focus();
  }, [cargando]);

  useEffect(() => {
    if (error) toast.error(error.message || "No pude responder. Probá de nuevo.");
  }, [error]);

  const enviar = (valor: string) => {
    const limpio = valor.trim();
    if (!limpio || cargando) return;
    void registrarMensaje({ autor: "vecino", texto: limpio, asunto: limpio }).catch(
      () => undefined,
    );
    if (enHandoff) {
      // Bypass del bot: el mensaje va solo a la bandeja del operador.
      setHistorialHumano((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          texto: limpio,
          fecha: new Date().toISOString(),
          mio: true,
        },
      ]);
      setTexto("");
      return;
    }
    void sendMessage({ text: limpio });
    setTexto("");
  };

  const aplicarAccion = async (clave: string, accion: AccionPropuesta) => {
    const d = (accion.datos ?? {}) as Record<string, string | undefined>;
    try {
      switch (accion.tipo) {
        case "crear_reclamo": {
          const t = await demo.crearTicket({
            titulo: d["titulo"] || "Reclamo desde el asistente",
            categoria: d["categoria"] || "Otros",
            descripcion: d["descripcion"] || accion.resumen,
            prioridad: (d["prioridad"] as "alta" | "media" | "baja") || "media",
          });
          toast.success(`Reclamo ${t.id} registrado. Te aviso apenas haya novedades.`);
          break;
        }
        case "reservar_espacio": {
          const lista = demo.amenities;
          const amenity =
            lista.find((a) => a.id === d["amenityId"]) ??
            lista.find((a) =>
              (d["amenityId"] ?? "").toLowerCase().includes(a.nombre.toLowerCase()),
            ) ??
            lista[0];
          if (!amenity) {
            toast.error("Tu consorcio todavía no tiene espacios comunes cargados.");
            break;
          }
          const r = await demo.crearReserva({
            amenityId: amenity.id,
            fecha: d["fecha"] || new Date().toISOString().slice(0, 10),
            franja: d["franja"] || amenity.franjas[0] || "12:00 a 17:00",
          });
          toast.success(`Reserva confirmada en ${r.amenityNombre}.`);
          break;
        }
        case "pedir_certificado": {
          const tipo =
            tiposCertificado.find((t) => t.id === d["certificadoId"]) ?? tiposCertificado[1]!;
          await pedirCertificado({ tipoId: tipo.id, nombre: tipo.nombre });
          toast.success(`Pedimos tu ${tipo.nombre.toLowerCase()}. Demora ${tipo.demora}.`);
          break;
        }
        case "registrar_mudanza": {
          const m = await demo.pedirMudanza({
            tipo: (d["tipoMudanza"] as "mudanza" | "flete" | "obra") || "mudanza",
            fecha: d["fecha"] || new Date().toISOString().slice(0, 10),
            franja: d["franja"] || "09:00 a 12:00",
          });
          toast.success(
            m.codigo
              ? `Turno registrado. Tu código es ${m.codigo}.`
              : "Turno registrado. La administración lo va a revisar.",
          );
          break;
        }

        case "pagar_expensas": {
          const boleta =
            demo.boletas.find((b) => b.id === d["boletaId"]) ??
            demo.boletas.find((b) => b.estado !== "paga");
          if (boleta) {
            await demo.pagarBoleta(boleta.id);
            toast.success(`Pago simulado aprobado para ${boleta.periodo}.`);
          }
          break;
        }
      }
      setAplicadas((prev) => ({ ...prev, [clave]: "hecho" }));
    } catch {
      toast.error("No pude completar la acción en el prototipo.");
    }
  };

  const renderMensaje = (m: (typeof messages)[number]) => (
          <div key={m.id} className="space-y-2">
            {m.parts.map((part, i) => {
              const clave = `${m.id}-${i}`;
              if (part.type === "text") {
                return (
                  <div
                    key={clave}
                    className={cn(
                      "flex gap-2",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {m.role === "assistant" && <Isotipo className="mt-1 h-6 w-6 shrink-0" />}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-card text-card-foreground shadow-sm",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="space-y-2 [&_a]:text-accent [&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold">
                          <ReactMarkdown>{part.text}</ReactMarkdown>
                        </div>
                      ) : (
                        part.text
                      )}
                    </div>
                  </div>
                );
              }

              if (part.type === "tool-protocolo_emergencia" && "output" in part && part.output) {
                const out = part.output as {
                  aviso: string;
                  pasos: string[];
                  telefonos: { nombre: string; telefono: string }[];
                };
                return (
                  <Card key={clave} className="border-destructive/40 bg-destructive/5">
                    <CardContent className="p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertTriangle className="h-4 w-4" /> Situación de riesgo
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{out.aviso}</p>
                      <ul className="mt-3 space-y-1 text-sm">
                        {out.pasos?.map((p) => (
                          <li key={p} className="flex gap-2">
                            <span className="text-destructive">•</span> {p}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {out.telefonos?.map((t) => (
                          <a
                            key={t.telefono}
                            href={`tel:${t.telefono}`}
                            className="rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground"
                          >
                            {t.nombre} · {t.telefono}
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              if (part.type === "tool-derivar_a_persona" && "output" in part && part.output) {
                const out = part.output as { motivo: string };
                const hecho = derivaciones[clave] === true;
                return (
                  <Card key={clave} className="border-accent/40 bg-accent/5">
                    <CardContent className="p-4">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Headset className="h-4 w-4 text-accent" /> {out.motivo}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {hecho || conversacion?.estado === "esperando_humano" || conversacion?.estado === "humano"
                          ? "Tu consulta ya está en la bandeja de la administración."
                          : "Puedo pasarle esta conversación a una persona del equipo."}
                      </p>
                      {!hecho && conversacion?.estado !== "humano" && (
                        <Button
                          size="sm"
                          disabled={derivando}
                          className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => {
                            void derivar(out.motivo)
                              .then(() => {
                                setDerivaciones((prev) => ({ ...prev, [clave]: true }));
                                toast.success("Listo, una persona del equipo te va a responder acá.");
                              })
                              .catch((e: unknown) =>
                                toast.error(
                                  e instanceof Error ? e.message : "No pude derivar la consulta.",
                                ),
                              );
                          }}
                        >
                          Hablar con una persona
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              }

              if (part.type === "tool-proponer_accion" && "output" in part && part.output) {
                const accion = part.output as AccionPropuesta;
                const hecho = aplicadas[clave] === "hecho";
                return (
                  <Card key={clave} className="border-accent/40 bg-accent/5">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium">{accion.resumen}</p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          disabled={hecho}
                          onClick={() => void aplicarAccion(clave, accion)}
                          className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          {hecho ? "Listo" : "Confirmar"}
                        </Button>
                        {!hecho && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => enviar("Mejor no, cancelemos eso.")}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })}
          </div>
  );

  const corte = corteHandoff ?? messages.length;

  return (
    <div className="flex min-h-[calc(100vh-15rem)] flex-col">
      <div className="flex-1 space-y-4">
        {messages.slice(0, corte).map(renderMensaje)}

        {historialHumano
          .slice()
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
          .map((m) =>
            m.mio ? (
              <div key={m.id} className="flex justify-end gap-2">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.texto}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15">
                  <Headset className="h-3.5 w-3.5 text-accent" />
                </span>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
                  <p className="mb-1 text-xs font-medium text-accent">Administración</p>
                  {m.texto}
                </div>
              </div>
            ),
          )}

        {enHandoff && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Headset className="h-3.5 w-3.5" />
              {conversacion?.estado === "humano"
                ? "Estás hablando con una persona del equipo. El asistente automático quedó en pausa hasta que se cierre la conversación."
                : "Tu consulta está en la bandeja de la administración. Te respondemos por acá y el asistente automático queda en pausa."}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={cerrando}
              onClick={() => {
                void cerrarPropia()
                  .then(() =>
                    toast.success("Cerramos el chat con la administración. Vuelve el asistente."),
                  )
                  .catch(() => toast.error("No pudimos cerrar el chat."));
              }}
            >
              Finalizar chat y volver al asistente
            </Button>
          </div>
        )}

        {!enHandoff && historialHumano.length > 0 && (
          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-border" />
            <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
              Conversación finalizada
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        )}

        {messages.slice(corte).map(renderMensaje)}

        {cargando && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Isotipo className="h-6 w-6" />
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Estoy pensando…
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="sticky bottom-24 mt-4 space-y-3 bg-background pt-2">
        <div className={cn("flex gap-2 overflow-x-auto pb-1", enHandoff && "hidden")}>
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => enviar(s)}
              className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {s}
            </button>
          ))}
        </div>

        {!enHandoff && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={derivando}
            className="w-full"
            onClick={() => {
              void derivar("Quiere hablar con una persona del equipo")
                .then(() => toast.success("Listo, una persona del equipo te va a responder acá."))
                .catch((e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "No pude derivar la consulta."),
                );
            }}
          >
            <Headset className="mr-1 h-4 w-4" /> Hablar con una persona
          </Button>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
        >
          <Textarea
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(texto);
              }
            }}
            rows={1}
            autoFocus
            placeholder={
              enHandoff ? "Escribile a la administración…" : "Escribí como hablás…"
            }
            aria-label="Mensaje para el asistente"
            className="max-h-32 min-h-11 resize-none bg-card"
          />
          <Button
            type="submit"
            size="icon"
            disabled={cargando || !texto.trim()}
            aria-label="Enviar mensaje"
            className="h-11 w-11 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
