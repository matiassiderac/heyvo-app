import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Users, Video } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFecha } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/asambleas")({
  head: () => ({
    meta: [
      { title: "Asambleas y votaciones — HEYVO" },
      {
        name: "description",
        content:
          "Temario, convocatoria y votación digital de las asambleas de tu consorcio, con resultados por coeficiente.",
      },
      { property: "og:title", content: "Asambleas y votaciones — HEYVO" },
      {
        property: "og:description",
        content: "Participá de la asamblea y votá desde el celular.",
      },
    ],
  }),
  component: Asambleas,
});

function Asambleas() {
  const { asambleas, cargandoAsambleas, votos, votar } = useDemo();

  return (
    <AppShell titulo="Asambleas" subtitulo="Participá aunque no puedas ir.">
      <div className="space-y-4">
        {cargandoAsambleas && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Buscando las asambleas de tu consorcio…
            </CardContent>
          </Card>
        )}
        {!cargandoAsambleas && asambleas.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Todavía no hay asambleas convocadas.
            </CardContent>
          </Card>
        )}
        {asambleas.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4">

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatFecha(a.fecha)}
                  </p>
                </div>
                <Badge variant={a.estado === "convocada" ? "default" : "secondary"}>
                  {a.estado === "convocada" ? "Convocada" : "Cerrada"}
                </Badge>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                {a.modalidad === "presencial" ? (
                  <Users className="h-3.5 w-3.5" />
                ) : (
                  <Video className="h-3.5 w-3.5" />
                )}
                Modalidad {a.modalidad}
              </p>

              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Temario
              </h3>
              <ul className="mt-1 space-y-1 text-sm">
                {a.temario.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-accent">•</span> {t}
                  </li>
                ))}
              </ul>

              {a.votaciones.map((v) => {
                const miVoto = votos[v.id] ?? v.votoEmitido;
                return (
                  <div key={v.id} className="mt-4 rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{v.tema}</p>
                    {v.resultado ? (
                      <ul className="mt-2 space-y-1.5 text-xs">
                        {Object.entries(v.resultado).map(([opcion, valor]) => (
                          <li key={opcion}>
                            <span className="flex justify-between">
                              <span>{opcion}</span>
                              <span className="text-muted-foreground">{valor}%</span>
                            </span>
                            <span className="mt-1 block h-1.5 w-full rounded-full bg-muted">
                              <span
                                className="block h-1.5 rounded-full bg-accent"
                                style={{ width: `${valor}%` }}
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {v.opciones.map((o) => (
                          <Button
                            key={o}
                            size="sm"
                            variant={miVoto === o ? "default" : "outline"}
                            className={cn(
                              miVoto === o && "bg-accent text-accent-foreground hover:bg-accent/90",
                            )}
                            onClick={() => {
                              void votar(v.id, o)
                                .then(() => toast.success(`Voto registrado: ${o}.`))
                                .catch(() =>
                                  toast.error("No pudimos registrar tu voto."),
                                );
                            }}

                          >
                            {o}
                          </Button>
                        ))}
                      </div>
                    )}
                    {miVoto && !v.resultado && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ya votaste. Podés cambiar tu voto hasta el cierre.
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
      <PieDemo />
    </AppShell>
  );
}
