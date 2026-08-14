import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Bell, Megaphone, Wrench } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFecha } from "@/data/demo";
import { useDemo, type AvisoApp } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos del consorcio — HEYVO" },
      {
        name: "description",
        content:
          "Gestión de avisos, novedades y comunicaciones del consorcio para los residentes.",
      },
      { property: "og:title", content: "Avisos del consorcio — HEYVO" },
      {
        property: "og:description",
        content: "Publicá y controlá los avisos del edificio.",
      },
    ],
  }),
  component: AdminAvisos,
});

const iconos = {
  urgente: AlertTriangle,
  mantenimiento: Wrench,
  informativo: Bell,
} as const;

const variantes: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  urgente: "destructive",
  mantenimiento: "secondary",
  informativo: "default",
};

function AdminAvisos() {
  const { avisos, cargandoAvisos, crearAviso } = useDemo();
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [tipo, setTipo] = useState<AvisoApp["tipo"]>("informativo");
  const [guardando, setGuardando] = useState(false);

  const publicar = async () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      toast.error("Completá el título y el cuerpo del aviso.");
      return;
    }
    setGuardando(true);
    try {
      await crearAviso({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), tipo });
      setTitulo("");
      setCuerpo("");
      setTipo("informativo");
      toast.success("Aviso publicado para todo el consorcio.");
    } catch {
      toast.error("No pudimos publicar el aviso.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AdminShell
      titulo="Avisos"
      subtitulo="Comunicaciones publicadas para los residentes del consorcio."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Megaphone className="h-4 w-4 text-accent" />
              <span>
                Los avisos se muestran en el portal de cada residente ordenados por fecha.
              </span>
            </div>
            <div className="space-y-2">
              {cargandoAvisos && (
                <p className="text-sm text-muted-foreground">Buscando avisos…</p>
              )}
              {!cargandoAvisos && avisos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todavía no publicaste ningún aviso.
                </p>
              )}
              {avisos.map((a) => {
                const Icon = iconos[a.tipo];
                return (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "mt-0.5 h-5 w-5 shrink-0",
                          a.tipo === "urgente" ? "text-destructive" : "text-accent",
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium">{a.titulo}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{a.cuerpo}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatFecha(a.fecha)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={variantes[a.tipo]} className="shrink-0 capitalize">
                      {a.tipo}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Nuevo aviso</p>
            <div className="space-y-1.5">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Corte de agua programado"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cuerpo">Mensaje</Label>
              <Textarea
                id="cuerpo"
                rows={5}
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                placeholder="Contale a los vecinos qué pasa, cuándo y qué tienen que hacer."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as AvisoApp["tipo"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informativo">Informativo</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={guardando}
              onClick={() => void publicar()}
            >
              Publicar aviso
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

