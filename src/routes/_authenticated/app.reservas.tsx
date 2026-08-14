import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Info } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatARS, formatFecha } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/reservas")({
  head: () => ({
    meta: [
      { title: "Reservas de espacios comunes — HEYVO" },
      {
        name: "description",
        content:
          "Reservá el SUM, la parrilla, el coworking o el laundry del edificio y consultá las reglas de uso.",
      },
      { property: "og:title", content: "Reservas de espacios comunes — HEYVO" },
      {
        property: "og:description",
        content: "Elegí el espacio, la fecha y la franja. Confirmación al instante.",
      },
    ],
  }),
  component: Reservas,
});

function Reservas() {
  const { amenities, cargandoAmenities, reservas, cargandoReservas, crearReserva, cancelarReserva } =
    useDemo();
  const [amenityIdSel, setAmenityIdSel] = useState<string | null>(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [franjaSel, setFranjaSel] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);

  const amenityId = amenityIdSel ?? amenities[0]?.id ?? null;
  const amenity = amenities.find((a) => a.id === amenityId);
  const franja = franjaSel ?? amenity?.franjas[0] ?? "";
  const mias = reservas;

  const reservar = () => {
    if (!amenity || !franja) return;
    setReservando(true);
    void crearReserva({ amenityId: amenity.id, fecha, franja })
      .then(() => toast.success(`Reserva confirmada en ${amenity.nombre}.`))
      .catch((error: Error) => toast.error(error.message || "No pudimos confirmar la reserva."))
      .finally(() => setReservando(false));
  };

  if (cargandoAmenities) {
    return (
      <AppShell titulo="Reservas" subtitulo="Espacios comunes del edificio.">
        <p className="py-8 text-center text-sm text-muted-foreground">Cargando espacios…</p>
      </AppShell>
    );
  }

  if (amenities.length === 0) {
    return (
      <AppShell titulo="Reservas" subtitulo="Espacios comunes del edificio.">
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Tu consorcio todavía no tiene espacios comunes cargados para reservar.
          </CardContent>
        </Card>
        <PieDemo />
      </AppShell>
    );
  }

  return (
    <AppShell titulo="Reservas" subtitulo="Espacios comunes del edificio.">
      <Tabs defaultValue="reservar">
        <TabsList className="w-full">
          <TabsTrigger value="reservar" className="flex-1">
            Reservar
          </TabsTrigger>
          <TabsTrigger value="mias" className="flex-1">
            Mis reservas ({mias.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reservar" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {amenities.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAmenityIdSel(a.id);
                  setFranjaSel(a.franjas[0] ?? null);
                }}
                className={cn(
                  "rounded-xl border p-3 text-left text-sm transition-colors",
                  a.id === amenityId
                    ? "border-accent bg-accent/8"
                    : "border-border bg-card hover:border-accent/40",
                )}
              >
                <span className="block font-medium">{a.nombre}</span>
                <span className="block text-xs text-muted-foreground">
                  Hasta {a.capacidad} personas
                </span>
              </button>
            ))}
          </div>

          {amenity && (
            <Card>
              <CardContent className="space-y-4 p-4">
                <p className="text-sm text-muted-foreground">{amenity.descripcion}</p>

                <div className="space-y-1.5">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Franja horaria</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenity.franjas.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFranjaSel(f)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          f === franja
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-card",
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <ul className="space-y-1 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                  {amenity.reglas.map((r) => (
                    <li key={r} className="flex gap-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> {r}
                    </li>
                  ))}
                </ul>

                {amenity.requiereDeposito ? (
                  <p className="text-xs text-muted-foreground">
                    Depósito reintegrable de {formatARS(amenity.requiereDeposito)}.
                  </p>
                ) : null}

                <Button
                  onClick={reservar}
                  disabled={reservando}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <CalendarDays className="mr-1 h-4 w-4" /> Confirmar reserva
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mias" className="mt-4 space-y-3">
          {cargandoReservas ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando reservas…</p>
          ) : (
            <>
              {mias.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Todavía no tenés reservas.
                  </CardContent>
                </Card>
              )}
              {mias.map((r) => {
                const a = amenities.find((x) => x.id === r.amenityId);
                return (
                  <Card key={r.id}>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium">{a?.nombre ?? "Espacio común"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFecha(r.fecha)} · {r.franja}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.estado === "cancelada" ? "secondary" : "default"}>
                          {r.estado}
                        </Badge>
                        {r.estado !== "cancelada" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              void cancelarReserva(r.id)
                                .then(() => toast.success("Reserva cancelada."))
                                .catch(() => toast.error("No pudimos cancelar la reserva."));
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>
      <PieDemo />
    </AppShell>
  );
}
