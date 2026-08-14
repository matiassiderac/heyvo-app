import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock, Wallet } from "lucide-react";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  asambleas,
  consorcios,
  etiquetasEstadoTicket,
  formatARS,
  formatFecha,
} from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Panel de administración — HEYVO" },
      {
        name: "description",
        content:
          "Estado de los consorcios administrados: reclamos vencidos, cobranza del mes, conversaciones y asambleas próximas.",
      },
      { property: "og:title", content: "Panel de administración — HEYVO" },
      {
        property: "og:description",
        content: "El día del administrador en una sola pantalla.",
      },
    ],
  }),
  component: Panel,
});

function Panel() {
  const { tickets, boletas } = useDemo();
  const abiertos = tickets.filter((t) => !["cerrado", "resuelto"].includes(t.estado));
  const vencidos = abiertos.filter((t) => new Date(t.vence) < new Date("2026-08-06"));
  const cobrado = boletas.filter((b) => b.estado === "paga").reduce((a, b) => a + b.total, 0);
  const pendiente = boletas
    .filter((b) => b.estado !== "paga")
    .reduce((a, b) => a + b.total, 0);
  const morosidad = Math.round((pendiente / (cobrado + pendiente)) * 100);

  const kpis = [
    { label: "Reclamos abiertos", valor: String(abiertos.length), icon: Clock },
    { label: "Fuera de plazo", valor: String(vencidos.length), icon: AlertTriangle },
    { label: "Cobrado en el mes", valor: formatARS(cobrado), icon: Wallet },
    { label: "Morosidad", valor: `${morosidad}%`, icon: CheckCircle2 },
  ];

  return (
    <AdminShell
      titulo="Buen día, Estudio Ramos"
      subtitulo="Resumen operativo de los consorcios que administrás."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-accent" /> {k.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{k.valor}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Reclamos que piden atención</h2>
              <Link
                to="/admin/reclamos"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                Ver todos <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {abiertos.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.id} · {t.unidad} · vence {formatFecha(t.vence)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Badge variant={t.prioridad === "alta" ? "destructive" : "secondary"}>
                      {t.prioridad}
                    </Badge>
                    <Badge variant="outline">{etiquetasEstadoTicket[t.estado]}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Consorcios</h2>
              <div className="space-y-2">
                {consorcios.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.direccion} · {c.unidades} unidades
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold">Próxima asamblea</h2>
              {asambleas
                .filter((a) => a.estado === "convocada")
                .map((a) => (
                  <div key={a.id}>
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(a.fecha)} · modalidad {a.modalidad}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
