import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatARS } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/amenities")({
  head: () => ({
    meta: [
      { title: "Espacios comunes — HEYVO" },
      {
        name: "description",
        content: "Cargá el SUM, la parrilla u otros espacios comunes para que los residentes reserven.",
      },
      { property: "og:title", content: "Espacios comunes — HEYVO" },
      {
        property: "og:description",
        content: "Definí capacidad, reglas, franjas y depósito de cada espacio.",
      },
    ],
  }),
  component: AdminAmenities,
});

const lineas = (texto: string) =>
  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function AdminAmenities() {
  const { amenities, cargandoAmenities, crearAmenity } = useDemo();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [capacidad, setCapacidad] = useState("10");
  const [franjas, setFranjas] = useState("");
  const [reglas, setReglas] = useState("");
  const [deposito, setDeposito] = useState("");
  const [guardando, setGuardando] = useState(false);

  const crear = () => {
    if (!nombre.trim() || lineas(franjas).length === 0) {
      toast.error("Completá el nombre y al menos una franja horaria.");
      return;
    }
    setGuardando(true);
    void crearAmenity({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      capacidad: Number(capacidad) || 1,
      franjas: lineas(franjas),
      reglas: lineas(reglas),
      requiereDeposito: deposito.trim() ? Number(deposito) : null,
    })
      .then(() => {
        toast.success("Espacio común creado.");
        setNombre("");
        setDescripcion("");
        setCapacidad("10");
        setFranjas("");
        setReglas("");
        setDeposito("");
      })
      .catch(() => toast.error("No pudimos crear el espacio común."))
      .finally(() => setGuardando(false));
  };

  return (
    <AdminShell titulo="Espacios comunes" subtitulo="Lo que tus residentes pueden reservar.">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="am-nombre">Nombre</Label>
              <Input
                id="am-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="SUM"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-capacidad">Capacidad (personas)</Label>
              <Input
                id="am-capacidad"
                type="number"
                min={1}
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-descripcion">Descripción</Label>
            <Textarea
              id="am-descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Salón de usos múltiples con cocina y parrilla interior."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="am-franjas">Franjas horarias (una por línea)</Label>
              <Textarea
                id="am-franjas"
                rows={3}
                value={franjas}
                onChange={(e) => setFranjas(e.target.value)}
                placeholder={"12:00 a 17:00\n18:00 a 23:00"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="am-reglas">Reglas (una por línea)</Label>
              <Textarea
                id="am-reglas"
                rows={3}
                value={reglas}
                onChange={(e) => setReglas(e.target.value)}
                placeholder={"Se libera a las 2 de la mañana.\nNo se puede reservar con expensas vencidas."}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-deposito">Depósito reintegrable (opcional, en ARS)</Label>
            <Input
              id="am-deposito"
              type="number"
              min={0}
              value={deposito}
              onChange={(e) => setDeposito(e.target.value)}
              placeholder="60000"
            />
          </div>
          <Button
            onClick={crear}
            disabled={guardando}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="mr-1 h-4 w-4" /> Crear espacio común
          </Button>
        </CardContent>
      </Card>

      <h2 className="mb-2 mt-6 text-sm font-semibold">Espacios cargados</h2>
      {cargandoAmenities ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {amenities.length === 0 && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Todavía no cargaste ningún espacio común.
              </CardContent>
            </Card>
          )}
          {amenities.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <p className="text-sm font-medium">{a.nombre}</p>
                <p className="text-xs text-muted-foreground">{a.descripcion}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Hasta {a.capacidad} personas · {a.franjas.length} franja
                  {a.franjas.length === 1 ? "" : "s"}
                </p>
                {a.requiereDeposito ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Depósito {formatARS(a.requiereDeposito)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
