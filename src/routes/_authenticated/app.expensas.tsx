import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { crearIntentoPago } from "@/lib/pagos.functions";

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
  const { boletas, sesion } = useDemo();
  const crearIntento = useServerFn(crearIntentoPago);
  const navigate = useNavigate();
  const [aPagar, setAPagar] = useState<Boleta | null>(null);
  const [pagando, setPagando] = useState(false);

  const confirmar = async () => {
    if (!aPagar) return;
    setPagando(true);
    try {
      const intento = await crearIntento({ data: { boletaId: aPagar.id } });
      setAPagar(null);
      await navigate({
        to: "/app/pago/$referencia",
        params: { referencia: intento.referencia_externa },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos iniciar el pago.");
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

      <PieDemo texto="Pagos en entorno de prueba (sandbox). Cada consorcio conecta su propia cuenta de Mercado Pago." />

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
              Entorno de prueba: te llevamos al checkout y la boleta se acredita cuando
              llega la notificación del pago.
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
              {pagando ? "Abriendo checkout…" : "Ir a pagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
