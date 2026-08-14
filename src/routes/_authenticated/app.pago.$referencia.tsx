import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatARS } from "@/data/demo";
import { estadoIntentoPago, simularNotificacionPago } from "@/lib/pagos.functions";

export const Route = createFileRoute("/_authenticated/app/pago/$referencia")({
  head: () => ({
    meta: [
      { title: "Checkout de expensas — HEYVO" },
      {
        name: "description",
        content:
          "Pantalla de pago de expensas en entorno de prueba: sin cobros reales, con acreditación automática por webhook.",
      },
      { property: "og:title", content: "Checkout de expensas — HEYVO" },
      {
        property: "og:description",
        content: "Pagá tus expensas y mirá la acreditación en el momento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PagoSandbox,
  errorComponent: () => (
    <AppShell titulo="Pago">
      <p className="text-sm text-muted-foreground">
        No pudimos abrir ese pago. Volvé a Expensas e intentá de nuevo.
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell titulo="Pago">
      <p className="text-sm text-muted-foreground">Ese pago no existe.</p>
    </AppShell>
  ),
});

function PagoSandbox() {
  const { referencia } = useParams({ from: "/_authenticated/app/pago/$referencia" });
  const consultar = useServerFn(estadoIntentoPago);
  const simular = useServerFn(simularNotificacionPago);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [procesando, setProcesando] = useState<"aprobado" | "rechazado" | null>(null);

  const intentoQuery = useQuery({
    queryKey: ["heyvo", "pago-intento", referencia],
    queryFn: () => consultar({ data: { referencia } }),
  });

  const intento = intentoQuery.data;

  const resolver = async (resultado: "aprobado" | "rechazado") => {
    if (!intento) return;
    setProcesando(resultado);
    try {
      await simular({ data: { intentoId: intento.id, resultado } });
      await Promise.all([
        intentoQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["heyvo", "boletas"] }),
      ]);
      if (resultado === "aprobado") toast.success("Pago acreditado. Tu boleta quedó paga.");
      else toast.error("El pago fue rechazado. Podés volver a intentarlo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos procesar el pago.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <AppShell titulo="Checkout" subtitulo="Entorno de prueba: no se genera ningún cobro real.">
      {intentoQuery.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Abriendo el pago…
        </p>
      )}

      {intento && (
        <>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <p className="text-xs text-primary-foreground/70">
                Expensas {intento.periodo}
              </p>
              <p className="mt-1 text-3xl font-semibold">{formatARS(Number(intento.importe))}</p>
              <p className="mt-2 text-xs text-primary-foreground/70">
                Referencia {intento.referencia_externa}
              </p>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="space-y-3 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-accent" /> Mercado Pago del consorcio
                (sandbox)
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Estado del intento:</span>
                <Badge
                  variant={
                    intento.estado === "aprobado"
                      ? "secondary"
                      : intento.estado === "rechazado"
                        ? "destructive"
                        : "default"
                  }
                >
                  {intento.estado === "aprobado"
                    ? "Acreditado"
                    : intento.estado === "rechazado"
                      ? "Rechazado"
                      : "Pendiente"}
                </Badge>
              </div>
              {intento.detalle && (
                <p className="text-xs text-muted-foreground">{intento.detalle}</p>
              )}
            </CardContent>
          </Card>

          {intento.estado === "pendiente" ? (
            <div className="mt-4 space-y-2">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={procesando !== null}
                onClick={() => void resolver("aprobado")}
              >
                {procesando === "aprobado" ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-1 h-4 w-4" />
                )}
                Pagar {formatARS(Number(intento.importe))}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={procesando !== null}
                onClick={() => void resolver("rechazado")}
              >
                <XCircle className="mr-1 h-4 w-4" /> Simular pago rechazado
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm">
                {intento.estado === "aprobado" ? (
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                {intento.estado === "aprobado"
                  ? `La boleta de ${intento.periodo} quedó ${intento.estadoBoleta === "paga" ? "paga" : "actualizada"}.`
                  : "El pago no se acreditó."}
              </p>
              <Button className="w-full" onClick={() => void navigate({ to: "/app/expensas" })}>
                Volver a Expensas
              </Button>
            </div>
          )}
        </>
      )}

      <PieDemo texto="Pagos en entorno de prueba. Cada consorcio conecta su propia cuenta de Mercado Pago." />
    </AppShell>
  );
}
