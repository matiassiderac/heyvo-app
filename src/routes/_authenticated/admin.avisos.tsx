import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Bell, Send, Wrench } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
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
        content: "Publicá avisos para los residentes: cortes, novedades o mantenimiento.",
      },
      { property: "og:title", content: "Avisos del consorcio — HEYVO" },
      {
        property: "og:description",
        content: "Lo que publicás acá lo ven todos los residentes del consorcio.",
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

function AdminAvisos() {
  const { avisos, cargandoAvisos, crearAviso } = useDemo();
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [tipo, setTipo] = useState<AvisoApp["tipo"]>("informativo");
  const [publicando, setPublicando] = useState(false);

  const publicar = () => {
    if (!titulo.trim() || !cuerpo.trim()) {
      toast.error("Completá el título y el texto del aviso.");
      return;
    }
    setPublicando(true);
    void crearAviso({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), tipo })
      .then(() => {
        toast.success("Aviso publicado.");
        setTitulo("");
        setCuerpo("");
        setTipo("informativo");
      })
      .catch(() => toast.error("No pudimos publicar el aviso."))
      .finally(() => setPublicando(false));
  };

  return (
    <AdminShell titulo="Avisos" subtitulo="Comunicá novedades a todos los residentes.">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="aviso-titulo">Título</Label>
            <Input
              id="aviso-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Corte de agua programado"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aviso-cuerpo">Texto</Label>
            <Textarea
              id="aviso-cuerpo"
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              rows={3}
              placeholder="Contales a los residentes qué pasa y qué tienen que hacer."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as AvisoApp["tipo"])}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="informativo">Informativo</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={publicar}
            disabled={publicando}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Send className="mr-1 h-4 w-4" /> Publicar aviso
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-2 mt-6 text-sm font-semibold">Publicados</h2>
      {cargandoAvisos ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Cargando avisos…</p>
      ) : (
        <div className="space-y-2">
          {avisos.length === 0 && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Todavía no publicaste ningún aviso.
              </CardContent>
            </Card>
          )}
          {avisos.map((a) => {
            const Icon = iconos[a.tipo];
            return (
              <Card key={a.id}>
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
      )}
    </AdminShell>
  );
}
