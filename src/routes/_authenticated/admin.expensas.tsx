import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatARS, formatFecha } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/expensas")({
  head: () => ({
    meta: [
      { title: "Cobranzas y expensas — HEYVO" },
      {
        name: "description",
        content:
          "Estado de cobranza por período, deuda por unidad y envío de recordatorios de pago a los vecinos.",
      },
      { property: "og:title", content: "Cobranzas y expensas — HEYVO" },
      {
        property: "og:description",
        content: "Quién pagó, quién debe y a quién conviene recordarle.",
      },
    ],
  }),
  component: AdminExpensas,
});

function AdminExpensas() {
  const { boletas, personas, registrarRecordatorio } = useDemo();
  const total = boletas.reduce((a, b) => a + b.total, 0);
  const cobrado = boletas.filter((b) => b.estado === "paga").reduce((a, b) => a + b.total, 0);

  const deudaPorUnidad = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const b of boletas) {
      if (b.estado === "paga" || !b.unidadEtiqueta) continue;
      mapa.set(
        b.unidadEtiqueta,
        (mapa.get(b.unidadEtiqueta) ?? 0) + b.total + (b.interes ?? 0),
      );
    }
    return mapa;
  }, [boletas]);

  const residentesConUnidad = personas.filter((p) => p.unidadEtiqueta);

  const recordar = (boletaId: string, periodo: string) => {
    void registrarRecordatorio(boletaId)
      .then(() => toast.success(`Recordatorio registrado para ${periodo}.`))
      .catch(() => toast.error("No pudimos registrar el recordatorio."));
  };

  return (
    <AdminShell titulo="Cobranzas" subtitulo="Liquidaciones y estado de pago.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Emitido</p>
            <p className="mt-1 text-2xl font-semibold">{formatARS(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cobrado</p>
            <p className="mt-1 text-2xl font-semibold text-accent">{formatARS(cobrado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className="mt-1 text-2xl font-semibold">{formatARS(total - cobrado)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Liquidaciones emitidas</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boletas.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm font-medium">{b.periodo}</TableCell>
                    <TableCell className="text-sm">{formatFecha(b.vencimiento)}</TableCell>
                    <TableCell className="text-sm">{formatARS(b.total)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          b.estado === "paga"
                            ? "secondary"
                            : b.estado === "vencida"
                              ? "destructive"
                              : "default"
                        }
                      >
                        {b.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {b.estado !== "paga" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => recordar(b.id, b.periodo)}
                        >
                          Recordar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Deuda por unidad</h2>
          <div className="space-y-2">
            {residentesConUnidad.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {p.unidadEtiqueta} · {p.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
                <span className="text-sm font-semibold">
                  {formatARS(deudaPorUnidad.get(p.unidadEtiqueta!) ?? 0)}
                </span>
              </div>
            ))}
            {residentesConUnidad.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no hay residentes vinculados a una unidad.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
