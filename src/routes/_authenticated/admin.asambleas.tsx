import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Vote } from "lucide-react";
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
import { useDemo, type AsambleaApp } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/asambleas")({
  head: () => ({
    meta: [
      { title: "Asambleas — HEYVO" },
      {
        name: "description",
        content: "Convocá asambleas, cargá el temario y las votaciones, y cerrá para ver el resultado.",
      },
      { property: "og:title", content: "Asambleas — HEYVO" },
      {
        property: "og:description",
        content: "Convocatoria, temario y votación digital de tu consorcio.",
      },
    ],
  }),
  component: AdminAsambleas,
});

const lineas = (texto: string) =>
  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function NuevaAsamblea() {
  const { crearAsamblea } = useDemo();
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [modalidad, setModalidad] = useState<AsambleaApp["modalidad"]>("mixta");
  const [temario, setTemario] = useState("");
  const [guardando, setGuardando] = useState(false);

  const crear = () => {
    if (!titulo.trim() || !fecha) {
      toast.error("Completá el título y la fecha.");
      return;
    }
    setGuardando(true);
    void crearAsamblea({
      titulo: titulo.trim(),
      fecha: new Date(fecha).toISOString(),
      modalidad,
      temario: lineas(temario),
    })
      .then(() => {
        toast.success("Asamblea convocada.");
        setTitulo("");
        setFecha("");
        setTemario("");
        setModalidad("mixta");
      })
      .catch(() => toast.error("No pudimos convocar la asamblea."))
      .finally(() => setGuardando(false));
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="as-titulo">Título</Label>
            <Input
              id="as-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Asamblea ordinaria de agosto"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="as-fecha">Fecha y hora</Label>
            <Input
              id="as-fecha"
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Modalidad</Label>
          <Select
            value={modalidad}
            onValueChange={(v) => setModalidad(v as AsambleaApp["modalidad"])}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="mixta">Mixta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as-temario">Temario (un punto por línea)</Label>
          <Textarea
            id="as-temario"
            rows={3}
            value={temario}
            onChange={(e) => setTemario(e.target.value)}
            placeholder={"Aprobación del balance de julio.\nPresupuesto para impermeabilizar la terraza."}
          />
        </div>
        <Button
          onClick={crear}
          disabled={guardando}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-1 h-4 w-4" /> Convocar asamblea
        </Button>
      </CardContent>
    </Card>
  );
}

function VotacionForm({ asamblea }: { asamblea: AsambleaApp }) {
  const { agregarVotacion } = useDemo();
  const [tema, setTema] = useState("");
  const [opciones, setOpciones] = useState("A favor, En contra, Abstención");
  const [guardando, setGuardando] = useState(false);

  const agregar = () => {
    const lista = opciones
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    if (!tema.trim() || lista.length < 2) {
      toast.error("Completá el tema y al menos dos opciones separadas por coma.");
      return;
    }
    setGuardando(true);
    void agregarVotacion(asamblea.id, tema.trim(), lista, asamblea.votaciones.length)
      .then(() => {
        toast.success("Votación agregada.");
        setTema("");
        setOpciones("A favor, En contra, Abstención");
      })
      .catch(() => toast.error("No pudimos agregar la votación."))
      .finally(() => setGuardando(false));
  };

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">Agregar votación</p>
      <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema a votar" />
      <Input
        value={opciones}
        onChange={(e) => setOpciones(e.target.value)}
        placeholder="Opciones separadas por coma"
      />
      <Button size="sm" variant="outline" disabled={guardando} onClick={agregar}>
        <Vote className="mr-1 h-3.5 w-3.5" /> Agregar
      </Button>
    </div>
  );
}

function AdminAsambleas() {
  const { asambleas, cargandoAsambleas, actualizarEstadoAsamblea } = useDemo();

  const cambiarEstado = (id: string, estado: AsambleaApp["estado"]) => {
    void actualizarEstadoAsamblea(id, estado)
      .then(() =>
        toast.success(estado === "cerrada" ? "Asamblea cerrada. Ya se ve el resultado." : "Estado actualizado."),
      )
      .catch(() => toast.error("No pudimos actualizar el estado."));
  };

  return (
    <AdminShell titulo="Asambleas" subtitulo="Convocatoria, temario y votación digital.">
      <NuevaAsamblea />

      <h2 className="mb-2 mt-6 text-sm font-semibold">Asambleas</h2>
      {cargandoAsambleas ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="space-y-3">
          {asambleas.length === 0 && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Todavía no convocaste ninguna asamblea.
              </CardContent>
            </Card>
          )}
          {asambleas.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{a.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFecha(a.fecha)} · modalidad {a.modalidad}
                    </p>
                  </div>
                  <Select
                    value={a.estado}
                    onValueChange={(v) => cambiarEstado(a.id, v as AsambleaApp["estado"])}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="convocada">Convocada</SelectItem>
                      <SelectItem value="en_curso">En curso</SelectItem>
                      <SelectItem value="cerrada">Cerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {a.votaciones.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {a.votaciones.map((v) => (
                      <li key={v.id} className="flex items-center gap-2">
                        <Badge variant="outline">{v.opciones.length} opciones</Badge> {v.tema}
                      </li>
                    ))}
                  </ul>
                )}

                <VotacionForm asamblea={a} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
