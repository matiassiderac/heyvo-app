import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, MessageCircle, Phone, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useBandejaConversaciones, type ConversacionApp } from "@/lib/conversaciones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/conversaciones")({
  head: () => ({
    meta: [
      { title: "Bandeja omnicanal — HEYVO" },
      {
        name: "description",
        content:
          "Conversaciones de app, WhatsApp y email en una sola bandeja, con derivación del asistente a una persona.",
      },
      { property: "og:title", content: "Bandeja omnicanal — HEYVO" },
      {
        property: "og:description",
        content: "El asistente atiende y deriva; el equipo responde donde el vecino escribe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Conversaciones,
});

const iconos = {
  whatsapp: MessageCircle,
  app: Smartphone,
  email: Mail,
  telefono: Phone,
} as const;

const etiquetaEstado: Record<ConversacionApp["estado"], string> = {
  bot: "Atiende el asistente",
  esperando_humano: "Espera una persona",
  humano: "Atiende una persona",
  cerrada: "Cerrada",
};

const hora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function Conversaciones() {
  const { conversaciones, cargando, mensajesDe, tomar, responder, cerrar, trabajando } =
    useBandejaConversaciones();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  const hilo = useQuery({
    queryKey: ["heyvo", "mensajes-admin", abierta],
    enabled: !!abierta,
    refetchInterval: 15000,
    queryFn: () => mensajesDe(abierta!),
  });

  const seleccionada = conversaciones.find((c) => c.id === abierta) ?? null;

  const enviar = async () => {
    if (!abierta || !texto.trim()) return;
    try {
      await responder(abierta, texto.trim());
      setTexto("");
      await hilo.refetch();
      toast.success("Respuesta enviada al vecino.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos enviar la respuesta.");
    }
  };

  return (
    <AdminShell
      titulo="Conversaciones"
      subtitulo="App, WhatsApp y email en una sola bandeja."
    >
      {cargando && <p className="text-sm text-muted-foreground">Cargando la bandeja…</p>}

      {!cargando && conversaciones.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Todavía no hay conversaciones. Cuando el asistente derive una consulta, aparece acá.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {conversaciones.map((c) => {
            const Icon = iconos[c.canal];
            return (
              <Card
                key={c.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  abierta === c.id && "border-accent",
                )}
                onClick={() => setAbierta(c.id)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-accent" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{c.contacto}</p>
                      <span className="text-xs text-muted-foreground">
                        {hora(c.ultimoMensajeAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.consorcioNombre ?? "Consorcio sin nombre"}
                      {c.unidad && ` · ${c.unidad}`}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {c.ultimoMensaje ?? c.asunto}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          c.estado === "bot"
                            ? "secondary"
                            : c.estado === "esperando_humano"
                              ? "destructive"
                              : c.estado === "humano"
                                ? "default"
                                : "outline"
                        }
                      >
                        {etiquetaEstado[c.estado]}
                      </Badge>
                      {c.sinLeerAdmin > 0 && (
                        <Badge variant="destructive">{c.sinLeerAdmin} sin leer</Badge>
                      )}
                      {c.estado !== "humano" && c.estado !== "cerrada" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={trabajando}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAbierta(c.id);
                            void tomar(c.id)
                              .then(() => toast.success("Tomaste la conversación."))
                              .catch(() => toast.error("No pudimos tomar la conversación."));
                          }}
                        >
                          Tomar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="lg:sticky lg:top-32 lg:self-start">
          <CardContent className="p-4">
            {!seleccionada ? (
              <p className="text-sm text-muted-foreground">
                Elegí una conversación para ver el hilo y responder.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {seleccionada.contacto}
                      {seleccionada.unidad && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {seleccionada.unidad}
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-medium text-accent">
                      {seleccionada.consorcioNombre ?? "Consorcio sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">{seleccionada.asunto}</p>
                  </div>
                  {seleccionada.estado !== "cerrada" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={trabajando}
                      onClick={() => {
                        void cerrar(seleccionada.id)
                          .then(() => toast.success("Conversación cerrada."))
                          .catch(() => toast.error("No pudimos cerrarla."));
                      }}
                    >
                      Cerrar
                    </Button>
                  )}
                </div>

                <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto border-t border-border pt-3">
                  {hilo.isPending && (
                    <p className="text-xs text-muted-foreground">Cargando el hilo…</p>
                  )}
                  {(hilo.data ?? []).map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        m.autor === "operador"
                          ? "ml-auto bg-primary text-primary-foreground"
                          : m.autor === "asistente"
                            ? "bg-muted"
                            : "bg-accent/10",
                      )}
                    >
                      <p className="mb-0.5 text-[11px] uppercase opacity-70">
                        {m.autor === "operador"
                          ? "Administración"
                          : m.autor === "asistente"
                            ? "Asistente"
                            : "Vecino"}
                      </p>
                      {m.texto}
                    </div>
                  ))}
                  {!hilo.isPending && (hilo.data ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Todavía no hay mensajes en esta conversación.
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-end gap-2">
                  <Textarea
                    rows={2}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribí tu respuesta…"
                  />
                  <Button
                    size="icon"
                    disabled={trabajando || !texto.trim()}
                    onClick={() => void enviar()}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    aria-label="Enviar respuesta"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
