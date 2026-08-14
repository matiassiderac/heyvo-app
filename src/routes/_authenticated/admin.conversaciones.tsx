import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { conversaciones } from "@/data/demo";

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
    ],
  }),
  component: Conversaciones,
});

const iconos = { whatsapp: MessageCircle, app: Smartphone, email: Mail } as const;

function Conversaciones() {
  return (
    <AdminShell
      titulo="Conversaciones"
      subtitulo="App, WhatsApp y email en una sola bandeja."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {conversaciones.map((c) => {
          const Icon = iconos[c.canal];
          return (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-accent" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {c.contacto}{" "}
                      <span className="font-normal text-muted-foreground">· {c.unidad}</span>
                    </p>
                    <span className="text-xs text-muted-foreground">{c.hora}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.ultimoMensaje}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        c.estado === "bot"
                          ? "secondary"
                          : c.estado === "humano"
                            ? "default"
                            : "outline"
                      }
                    >
                      {c.estado === "bot"
                        ? "Atiende el asistente"
                        : c.estado === "humano"
                          ? "Atiende una persona"
                          : "Cerrada"}
                    </Badge>
                    {c.sinLeer > 0 && (
                      <Badge variant="destructive">{c.sinLeer} sin leer</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() =>
                        toast.success(
                          c.estado === "bot"
                            ? "Conversación derivada a una persona."
                            : "Respuesta enviada al vecino.",
                        )
                      }
                    >
                      {c.estado === "bot" ? "Tomar" : "Responder"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
