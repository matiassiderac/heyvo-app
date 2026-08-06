import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, Download, Landmark } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatARS, formatFecha, type Boleta } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/app/expensas")({
  head: () => ({
    meta: [
      { title: "Expensas y pagos — HEYVO" },
      {
        name: "description",
        content:
          "Consultá el detalle de tus expensas, descargá la liquidación y pagá desde el celular con Mercado Pago.",
      },
      { property: "og:title", content: "Expensas y pagos — HEYVO" },
      {
        property: "og:description",
        content: "El detalle de tu liquidación y el pago, en la misma pantalla.",
      },
    ],
  }),
  component: Expensas,
});

function Expensas() {
  const { boletas, pagarBoleta, sesion } = useDemo();
  const [aPagar, setAPagar] = useState<Boleta | null>(null);
  const [pagando, setPagando] = useState(false);

  const confirmar = async () => {
    if (!aPagar) return;
    setPagando(true);
    try {
      await pagarBoleta(aPagar.id);
      toast.success("Pago simulado aprobado. En la fase 3 se conecta Mercado Pago real.");
      setAPagar(null);
    } catch {
      toast.error("No pudimos registrar el pago. Probá de nuevo.");
    } finally {
      setPagando(false);
    }
  };

  const deuda = boletas
    .filter((b) => b.estado !== "paga")
    .reduce((a, b) => a + b.total + (b.interes ?? 0), 0);

  return (
    <AppShell titulo="Expensas" subtitulo={`Tu cuenta de la unidad ${sesion?.unidadEtiqueta ?? ""}.`}>
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-xs text-primary-foreground/70">Total a pagar</p>
          <p className="mt-1 text-3xl font-semibold">{formatARS(deuda)}</p>
          <p className="mt-1 text-xs text-primary-foreground/70">
            Incluye intereses por mora si corresponde.
          </p>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="mt-4 space-y-2">
        {boletas.map((b) => (
          <AccordionItem
            key={b.id}
            value={b.id}
            className="rounded-xl border border-border bg-card px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-3 pr-2 text-left">
                <div>
                  <p className="text-sm font-medium">{b.periodo}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence {formatFecha(b.vencimiento)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatARS(b.total)}</p>
                  <Badge
                    variant={
                      b.estado === "paga"
                        ? "secondary"
                        : b.estado === "vencida"
                          ? "destructive"
                          : "default"
                    }
                    className="mt-1"
                  >
                    {b.estado === "paga" ? "Paga" : b.estado === "vencida" ? "Vencida" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1.5 border-t border-border pt-3 text-sm">
                {b.detalle.map((d) => (
                  <li key={d.concepto} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{d.concepto}</span>
                    <span>{formatARS(d.monto)}</span>
                  </li>
                ))}
                {b.interes ? (
                  <li className="flex justify-between gap-3 text-destructive">
                    <span>Intereses por mora</span>
                    <span>{formatARS(b.interes)}</span>
                  </li>
                ) : null}
              </ul>
              <div className="mt-3 flex gap-2">
                {b.estado !== "paga" && (
                  <Button
                    size="sm"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => setAPagar(b)}
                  >
                    <CreditCard className="mr-1 h-4 w-4" /> Pagar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => toast.info("En el prototipo la liquidación es de muestra.")}
                >
                  <Download className="mr-1 h-4 w-4" /> Liquidación
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <PieDemo texto="Los pagos son simulados. Cada consorcio conectará su propia cuenta de Mercado Pago en la fase de integraciones." />

      <Dialog open={!!aPagar} onOpenChange={(o) => !o && setAPagar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar {aPagar?.periodo}</DialogTitle>
            <DialogDescription>
              Vas a pagar {formatARS((aPagar?.total ?? 0) + (aPagar?.interes ?? 0))} a la
              cuenta del consorcio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Landmark className="h-4 w-4 text-accent" /> Mercado Pago del consorcio
            </p>
            <p className="text-xs text-muted-foreground">
              Prototipo: no se genera ningún cobro real.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAPagar(null)}>
              Volver
            </Button>
            <Button
              onClick={() => void confirmar()}
              disabled={pagando}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pagando ? "Procesando…" : "Confirmar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
