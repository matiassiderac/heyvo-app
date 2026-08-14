import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Isotipo } from "@/components/heyvo/marca";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { tiposCertificado } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";
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

export function AsistenteChat() {
  const demo = useDemo();
  const [texto, setTexto] = useState("");
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
    }),
    [demo.rol, demo.boletas, demo.tickets, demo.sesion],
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
    messages: [
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
    ],
  });

  const cargando = status === "submitted" || status === "streaming";

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
          const amenity =
            demo.amenities.find((a) => a.id === d["amenityId"]) ??
            demo.amenities.find((a) =>
              (d["amenityId"] ?? "").toLowerCase().includes(a.nombre.toLowerCase()),
            ) ??
            demo.amenities[0];
          if (!amenity) {
            toast.error("Todavía no hay espacios comunes cargados en tu consorcio.");
            break;
          }
          await demo.crearReserva({
            amenityId: amenity.id,
            fecha: d["fecha"] || new Date().toISOString().slice(0, 10),
            franja: d["franja"] || amenity.franjas[0] || "",
          });
          toast.success(`Reserva confirmada en ${amenity.nombre}.`);
          break;
        }
        case "pedir_certificado": {
          const tipo =
            tiposCertificado.find((t) => t.id === d["certificadoId"]) ?? tiposCertificado[1]!;
          await demo.pedirCertificado(tipo.id, tipo.nombre);
          toast.success(`Pedimos tu ${tipo.nombre.toLowerCase()}. Demora ${tipo.demora}.`);
          break;
        }
        case "registrar_mudanza": {
          const m = await demo.pedirMudanza({
            tipo: (d["tipoMudanza"] as "mudanza" | "flete" | "obra") || "mudanza",
            fecha: d["fecha"] || new Date().toISOString().slice(0, 10),
            franja: d["franja"] || "09:00 a 12:00",
          });
          toast.success(`Turno aprobado. Tu código es ${m.codigo ?? "—"}.`);
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

  return (
    <div className="flex min-h-[calc(100vh-15rem)] flex-col">
      <div className="flex-1 space-y-4">
        {messages.map((m) => (
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

              if (part.type === "tool-protocolo_emergencia" && "output" in part) {
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

              if (part.type === "tool-proponer_accion" && "output" in part) {
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
        ))}

        {cargando && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Isotipo className="h-6 w-6" />
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Estoy pensando…
          </div>
        )}
        <div ref={finRef} />
      </div>

      <div className="sticky bottom-24 mt-4 space-y-3 bg-background pt-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
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
            placeholder="Escribí como hablás…"
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
