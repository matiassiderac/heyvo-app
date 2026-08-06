import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  etiquetasEstadoTicket,
  formatFecha,
  proveedores,
  type PrioridadTicket,
} from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/reclamos")({
  head: () => ({
    meta: [
      { title: "Gestión de reclamos — HEYVO" },
      {
        name: "description",
        content:
          "Bandeja de reclamos con prioridad, plazo comprometido, proveedor asignado y estado de cada ticket.",
      },
      { property: "og:title", content: "Gestión de reclamos — HEYVO" },
      {
        property: "og:description",
        content: "Priorizá, asigná y cerrá reclamos sin perder el plazo.",
      },
    ],
  }),
  component: AdminReclamos,
});

function AdminReclamos() {
  const { tickets } = useDemo();
  const [busqueda, setBusqueda] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadTicket | "todas">("todas");

  const filtrados = tickets.filter((t) => {
    const coincide = `${t.id} ${t.titulo} ${t.unidad} ${t.categoria}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    return coincide && (prioridad === "todas" || t.prioridad === prioridad);
  });

  return (
    <AdminShell titulo="Reclamos" subtitulo="Bandeja operativa de todos los consorcios.">
      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número, unidad o texto"
              className="max-w-xs"
              aria-label="Buscar reclamos"
            />
            <Select
              value={prioridad}
              onValueChange={(v) => setPrioridad(v as PrioridadTicket | "todas")}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las prioridades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Asignado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <span className="block text-sm font-medium">{t.titulo}</span>
                      <span className="text-xs text-muted-foreground">{t.id}</span>
                    </TableCell>
                    <TableCell className="text-sm">{t.unidad}</TableCell>
                    <TableCell className="text-sm">{t.categoria}</TableCell>
                    <TableCell>
                      <Badge variant={t.prioridad === "alta" ? "destructive" : "secondary"}>
                        {t.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {etiquetasEstadoTicket[t.estado]}
                    </TableCell>
                    <TableCell className="text-sm">{formatFecha(t.vence)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.asignadoA ?? "Sin asignar"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        onValueChange={(v) =>
                          toast.success(`${t.id} asignado a ${v}. Le avisamos al vecino.`)
                        }
                      >
                        <SelectTrigger className="ml-auto w-40">
                          <SelectValue placeholder="Asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          {proveedores.map((p) => (
                            <SelectItem key={p.id} value={p.nombre}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtrados.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay reclamos con esos filtros.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => toast.info("Exportación simulada en el prototipo.")}
            >
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
