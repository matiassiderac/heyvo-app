import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  categoriasReclamo,
  etiquetasEstadoTicket,
  formatFecha,
  slaHoras,
  type PrioridadTicket,
} from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/app/reclamos")({
  head: () => ({
    meta: [
      { title: "Reclamos y seguimiento — HEYVO" },
      {
        name: "description",
        content:
          "Cargá un reclamo con foto, seguí el estado paso a paso y enterate del plazo de respuesta comprometido.",
      },
      { property: "og:title", content: "Reclamos y seguimiento — HEYVO" },
      {
        property: "og:description",
        content: "De la foto al cierre: el reclamo con estado visible en todo momento.",
      },
    ],
  }),
  component: Reclamos,
});

function Reclamos() {
  const { tickets, crearTicket, sesion } = useDemo();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState(categoriasReclamo[0] ?? "Otros");
  const [prioridad, setPrioridad] = useState<PrioridadTicket>("media");
  const [descripcion, setDescripcion] = useState("");

  const mios = sesion?.unidadEtiqueta
    ? tickets.filter((t) => t.unidad === sesion.unidadEtiqueta)
    : tickets;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const t = await crearTicket({ titulo, categoria, descripcion, prioridad });
      setAbierto(false);
      setTitulo("");
      setDescripcion("");
      toast.success(
        `Reclamo ${t.id} registrado. Respuesta comprometida en ${slaHoras[prioridad]} horas.`,
      );
    } catch {
      toast.error("No pudimos registrar el reclamo. Probá de nuevo.");
    }
  };

  return (
    <AppShell
      titulo="Reclamos"
      subtitulo="Todo lo que pediste, con su estado."
      accion={
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-1 h-4 w-4" /> Nuevo
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
            <SheetHeader className="text-left">
              <SheetTitle>Nuevo reclamo</SheetTitle>
              <SheetDescription>
                Contanos qué pasa. Si es urgente lo priorizamos automáticamente.
              </SheetDescription>
            </SheetHeader>
            <form className="mt-4 space-y-4 pb-6" onSubmit={(e) => void enviar(e)}>
              <div className="space-y-1.5">
                <Label htmlFor="titulo">¿Qué pasó?</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Por ejemplo: pérdida de agua en la cocina"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasReclamo.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select
                  value={prioridad}
                  onValueChange={(v) => setPrioridad(v as PrioridadTicket)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta — respuesta en 4 horas</SelectItem>
                    <SelectItem value="media">Media — respuesta en 24 horas</SelectItem>
                    <SelectItem value="baja">Baja — respuesta en 72 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desc">Detalle</Label>
                <Textarea
                  id="desc"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={4}
                  placeholder="Sumá los datos que ayuden al proveedor."
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => toast.info("En el prototipo la foto es de muestra.")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm text-muted-foreground"
              >
                <Camera className="h-4 w-4" /> Adjuntar foto
              </button>
              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Enviar reclamo
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      }
    >
      <div className="space-y-3">
        {mios.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.id} · {t.categoria} · {formatFecha(t.creado)}
                  </p>
                </div>
                <Badge variant={t.prioridad === "alta" ? "destructive" : "secondary"}>
                  {etiquetasEstadoTicket[t.estado]}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">{t.descripcion}</p>

              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Vence {formatFecha(t.vence)}
                {t.asignadoA ? ` · ${t.asignadoA}` : ""}
              </p>

              <ol className="mt-3 space-y-2 border-l border-border pl-4 text-xs">
                {t.historial.map((h) => (
                  <li key={h.fecha + h.texto} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
                    <span className="block text-muted-foreground">{formatFecha(h.fecha)}</span>
                    {h.texto}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
      <PieDemo />
    </AppShell>
  );
}
