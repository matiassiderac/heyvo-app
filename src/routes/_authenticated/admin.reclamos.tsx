import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  type EstadoTicket,
  type PrioridadTicket,
} from "@/data/demo";
import { supabase } from "@/integrations/supabase/client";
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
  const { tickets, sesion } = useDemo();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadTicket | "todas">("todas");
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const proveedoresQuery = useQuery({
    queryKey: ["heyvo", "proveedores-admin", sesion?.userId],
    enabled: !!sesion?.esAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proveedores")
        .select("id, nombre, consorcio_id")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const refrescarTickets = async () => {
    await queryClient.invalidateQueries({ queryKey: ["heyvo", "tickets"] });
  };

  const registrarEvento = async (ticketId: string, texto: string) => {
    const { error } = await supabase.from("ticket_eventos").insert({
      ticket_id: ticketId,
      autor: sesion?.userId ?? null,
      texto,
    });
    if (error) throw error;
  };

  const asignar = async (ticketId: string, proveedorId: string) => {
    const proveedor = proveedoresQuery.data?.find((p) => p.id === proveedorId);
    setGuardando(true);
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ proveedor_id: proveedorId, estado: "asignado" })
        .eq("id", ticketId);
      if (error) throw error;
      await registrarEvento(ticketId, `Se asignó a ${proveedor?.nombre ?? "un proveedor"}.`);
      await refrescarTickets();
      toast.success(`Reclamo asignado a ${proveedor?.nombre ?? "proveedor"}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos asignar el reclamo.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (ticketId: string, estado: EstadoTicket) => {
    setGuardando(true);
    try {
      const { error } = await supabase.from("tickets").update({ estado }).eq("id", ticketId);
      if (error) throw error;
      await registrarEvento(ticketId, `Estado actualizado a ${etiquetasEstadoTicket[estado]}.`);
      await refrescarTickets();
      toast.success(`Estado actualizado a ${etiquetasEstadoTicket[estado]}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos actualizar el estado.");
    } finally {
      setGuardando(false);
    }
  };

  const agregarComentario = async () => {
    if (!detalleId || !comentario.trim()) return;
    setGuardando(true);
    try {
      await registrarEvento(detalleId, comentario.trim());
      setComentario("");
      await refrescarTickets();
      toast.success("Comentario agregado al historial.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos guardar el comentario.");
    } finally {
      setGuardando(false);
    }
  };

  const filtrados = tickets.filter((t) => {
    const coincide = `${t.id} ${t.titulo} ${t.unidad} ${t.categoria}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    return coincide && (prioridad === "todas" || t.prioridad === prioridad);
  });
  const detalle = tickets.find((t) => t.uuid === detalleId) ?? null;
  const estados: EstadoTicket[] = [
    "nuevo",
    "validando",
    "asignado",
    "en_curso",
    "esperando_tercero",
    "resuelto",
    "cerrado",
    "reabierto",
  ];

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
                      <div className="flex items-center justify-end gap-2">
                      <Select
                        value={t.proveedorId ?? ""}
                        disabled={guardando}
                        onValueChange={(v) => void asignar(t.uuid, v)}
                      >
                        <SelectTrigger className="ml-auto w-40">
                          <SelectValue placeholder="Asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          {(proveedoresQuery.data ?? [])
                            .filter((p) => p.consorcio_id === t.consorcioId)
                            .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Gestionar ${t.id}`}
                        onClick={() => setDetalleId(t.uuid)}
                      >
                        <MessageSquareText className="h-4 w-4" />
                      </Button>
                      </div>
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

        </CardContent>
      </Card>

      <Dialog open={!!detalle} onOpenChange={(open) => !open && setDetalleId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detalle && (
            <>
              <DialogHeader>
                <DialogTitle>{detalle.titulo}</DialogTitle>
                <DialogDescription>
                  {detalle.id} · {detalle.consorcioNombre ?? "Consorcio"} · {detalle.unidad}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Estado</span>
                  <Select
                    value={detalle.estado}
                    disabled={guardando}
                    onValueChange={(v) => void cambiarEstado(detalle.uuid, v as EstadoTicket)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {etiquetasEstadoTicket[estado]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Responsable</span>
                  <Select
                    value={detalle.proveedorId ?? ""}
                    disabled={guardando}
                    onValueChange={(v) => void asignar(detalle.uuid, v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      {(proveedoresQuery.data ?? [])
                        .filter((p) => p.consorcio_id === detalle.consorcioId)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Detalle</p>
                <p className="mt-1 text-sm text-muted-foreground">{detalle.descripcion}</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Historial completo</p>
                <ol className="space-y-3 border-l border-border pl-4">
                  {detalle.historial.map((evento) => (
                    <li key={`${evento.fecha}-${evento.texto}`} className="text-sm">
                      <span className="block text-xs text-muted-foreground">
                        {formatFecha(evento.fecha)}
                      </span>
                      {evento.texto}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agregar comentario o comunicación al residente"
                  rows={3}
                />
                <Button
                  disabled={guardando || !comentario.trim()}
                  onClick={() => void agregarComentario()}
                >
                  Agregar al historial
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
