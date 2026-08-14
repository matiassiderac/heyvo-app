import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, Wrench } from "lucide-react";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { formatFecha } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos del consorcio — HEYVO" },
      {
        name: "description",
        content:
          "Cortes de agua, mantenimiento y novedades del edificio, ordenados por fecha y marcados como leídos.",
      },
      { property: "og:title", content: "Avisos del consorcio — HEYVO" },
      {
        property: "og:description",
        content: "Enterate de lo que pasa en el edificio antes de que te afecte.",
      },
    ],
  }),
  component: Avisos,
});

const iconos = {
  urgente: AlertTriangle,
  mantenimiento: Wrench,
  informativo: Bell,
} as const;

function Avisos() {
  const { avisos, cargandoAvisos, marcarAvisoLeido } = useDemo();

  return (
    <AppShell titulo="Avisos" subtitulo="Novedades de tu edificio.">
      <div className="space-y-3">
        {cargandoAvisos && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Buscando novedades…
            </CardContent>
          </Card>
        )}
        {!cargandoAvisos && avisos.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Por ahora no hay avisos publicados.
            </CardContent>
          </Card>
        )}
        {avisos.map((a) => {
          const Icon = iconos[a.tipo];
          return (
            <Card
              key={a.id}
              onClick={() => {
                if (!a.leido) void marcarAvisoLeido(a.id);
              }}
              className={cn(
                "cursor-pointer transition-colors",
                !a.leido && "border-accent/40 bg-accent/5",
              )}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <Icon
                  className={cn(
                    "mt-0.5 h-5 w-5 shrink-0",
                    a.tipo === "urgente" ? "text-destructive" : "text-accent",
                  )}
                />
                <div>
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.cuerpo}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatFecha(a.fecha)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <PieDemo />
    </AppShell>
  );
}

