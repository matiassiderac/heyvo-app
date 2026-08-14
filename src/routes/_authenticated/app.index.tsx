import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarCheck,
  FileText,
  MessageCircle,
  Phone,
  Receipt,
  Truck,
  Vote,
  Wrench,
} from "lucide-react";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatARS, formatFecha } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Inicio del residente — HEYVO" },
      {
        name: "description",
        content:
          "Resumen de tu unidad: saldo de expensas, reclamos en curso, próximas reservas y avisos del consorcio.",
      },
      { property: "og:title", content: "Inicio del residente — HEYVO" },
      {
        property: "og:description",
        content: "Todo lo que pasa en tu edificio, resumido en una pantalla.",
      },
    ],
  }),
  component: Inicio,
});

const atajos = [
  { to: "/app/reservas", label: "Reservas", icon: CalendarCheck },
  { to: "/app/avisos", label: "Avisos", icon: Bell },
  { to: "/app/asambleas", label: "Asambleas", icon: Vote },
  { to: "/app/documentos", label: "Documentos", icon: FileText },
  { to: "/app/mudanzas", label: "Mudanzas", icon: Truck },
  { to: "/app/contacto", label: "Emergencias", icon: Phone },
] as const;

function Inicio() {
  const { boletas, tickets, reservas, avisos, asambleas, sesion } = useDemo();

  const pendientes = boletas.filter((b) => b.estado !== "paga");
  const saldo = pendientes.reduce((acc, b) => acc + b.total + (b.interes ?? 0), 0);
  const abiertos = tickets.filter(
    (t) =>
      !["cerrado", "resuelto"].includes(t.estado) &&
      (!sesion?.unidadEtiqueta || t.unidad === sesion.unidadEtiqueta),
  );
  const proxima = reservas.find(
    (r) =>
      r.estado === "confirmada" && (!sesion?.unidadId || r.unidadId === sesion.unidadId),
  );
  const avisoNuevo = avisos.find((a) => !a.leido);
  const asamblea = asambleas.find((a) => a.estado === "convocada");

  return (
    <AppShell titulo={`Hola, ${sesion?.nombre?.split(" ")[0] ?? ""}`.trim()} subtitulo="Esto es lo que pasa hoy en tu edificio.">
      {avisoNuevo && (
        <Link to="/app/avisos" className="block">
          <Card className="mb-4 border-accent/30 bg-accent/8">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium">{avisoNuevo.titulo}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {avisoNuevo.cuerpo}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Saldo de expensas</p>
          <p className="mt-1 text-3xl font-semibold">{formatARS(saldo)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pendientes.length === 0
              ? "Estás al día. Gracias."
              : `${pendientes.length} boleta${pendientes.length > 1 ? "s" : ""} sin pagar`}
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/app/expensas">
                <Receipt className="mr-1 h-4 w-4" /> Ver y pagar
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/app/reclamos">
                <Wrench className="mr-1 h-4 w-4" /> Nuevo reclamo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Link to="/app/asistente" className="mt-4 block">
        <Card className="border-primary bg-primary text-primary-foreground">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <MessageCircle className="h-5 w-5 text-accent-foreground" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Hablá con el asistente</p>
              <p className="text-xs text-primary-foreground/70">
                Contale qué necesitás con tus palabras. Entiende y resuelve.
              </p>
            </div>
            <ArrowRight className="h-4 w-4" />
          </CardContent>
        </Card>
      </Link>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">Tus reclamos</h2>
        {abiertos.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              No tenés reclamos abiertos.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {abiertos.slice(0, 2).map((t) => (
              <Link key={t.id} to="/app/reclamos" className="block">
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium">{t.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.id} · vence {formatFecha(t.vence)}
                      </p>
                    </div>
                    <Badge
                      variant={t.prioridad === "alta" ? "destructive" : "secondary"}
                      className="shrink-0"
                    >
                      {t.prioridad}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {proxima && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold">Próxima reserva</h2>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{formatFecha(proxima.fecha)}</p>
                <p className="text-xs text-muted-foreground">{proxima.franja}</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/app/reservas">Ver</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {asamblea && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold">Asamblea convocada</h2>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{asamblea.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFecha(asamblea.fecha)} · {asamblea.modalidad}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/app/asambleas">Ver temario</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">Todo lo demás</h2>
        <div className="grid grid-cols-3 gap-2">
          {atajos.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center text-xs font-medium transition-colors hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Icon className="h-5 w-5 text-accent" />
                {a.label}
              </Link>
            );
          })}
        </div>
      </section>

      <PieDemo />
    </AppShell>
  );
}
