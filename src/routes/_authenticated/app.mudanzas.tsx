import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Truck } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
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
import { formatFecha } from "@/data/demo";
import { useDemo, type MudanzaApp } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/app/mudanzas")({
  head: () => ({
    meta: [
      { title: "Mudanzas, fletes y obras — HEYVO" },
      {
        name: "description",
        content:
          "Pedí el turno de ascensor para tu mudanza, flete u obra y recibí el código de autorización para el encargado.",
      },
      { property: "og:title", content: "Mudanzas, fletes y obras — HEYVO" },
      {
        property: "og:description",
        content: "Turno de ascensor y código de acceso en un par de toques.",
      },
    ],
  }),
  component: Mudanzas,
});

const franjas = ["09:00 a 12:00", "13:00 a 16:00", "16:00 a 19:00"];

function Mudanzas() {
  const { mudanzas, cargandoMudanzas, pedirMudanza, sesion } = useDemo();
  const [tipo, setTipo] = useState<MudanzaApp["tipo"]>("mudanza");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [franja, setFranja] = useState(franjas[0]!);
  const [guardando, setGuardando] = useState(false);

  const mias = sesion?.unidadId
    ? mudanzas.filter((m) => m.unidadId === sesion.unidadId)
    : mudanzas;

  const pedir = async () => {
    setGuardando(true);
    try {
      const m = await pedirMudanza({ tipo, fecha, franja });
      toast.success(
        m.codigo
          ? `Turno registrado. Código ${m.codigo}.`
          : "Turno registrado. La administración lo va a revisar.",
      );
    } catch {
      toast.error("No pudimos registrar el turno. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <AppShell titulo="Mudanzas y fletes" subtitulo="Turnos de ascensor y accesos.">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label>Tipo de movimiento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as MudanzaApp["tipo"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mudanza">Mudanza completa</SelectItem>
                <SelectItem value="flete">Flete o entrega grande</SelectItem>
                <SelectItem value="obra">Obra o refacción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fecha-mu">Fecha</Label>
            <Input
              id="fecha-mu"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Franja</Label>
            <Select value={franja} onValueChange={setFranja}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {franjas.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={guardando}
            onClick={() => void pedir()}
          >
            <Truck className="mr-1 h-4 w-4" /> Pedir turno
          </Button>
          <p className="text-xs text-muted-foreground">
            El reglamento pide avisar con 48 horas y proteger el ascensor con las mantas
            del edificio.
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-2 mt-5 text-sm font-semibold">Tus turnos</h2>
      <div className="space-y-2">
        {cargandoMudanzas && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Buscando tus turnos…
            </CardContent>
          </Card>
        )}
        {!cargandoMudanzas && mias.length === 0 && (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Todavía no pediste ningún turno.
            </CardContent>
          </Card>
        )}
        {mias.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium capitalize">{m.tipo}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFecha(m.fecha)} · {m.franja}
                </p>
                {m.codigo && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-accent">
                    <KeyRound className="h-3.5 w-3.5" /> {m.codigo}
                  </p>
                )}
              </div>
              <Badge variant={m.estado === "aprobada" ? "default" : "secondary"}>
                {m.estado}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <PieDemo />
    </AppShell>
  );
}
