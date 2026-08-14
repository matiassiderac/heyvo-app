import { createFileRoute } from "@tanstack/react-router";

import { procesarEventoPago } from "@/lib/pagos.server";

/**
 * Webhook de cobros (sandbox). Verifica la firma HMAC antes de tocar la base y es
 * idempotente: el mismo evento repetido no vuelve a impactar la boleta.
 */
export const Route = createFileRoute("/api/public/webhooks/pagos/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const firma =
          request.headers.get("x-heyvo-signature") ??
          request.headers.get("x-signature");

        const res = await procesarEventoPago(rawBody, firma);
        if (!res.ok) {
          console.error("[heyvo/pagos-webhook]", res.status, res.mensaje);
          return new Response(res.mensaje, { status: res.status });
        }
        return Response.json({ ok: true, resultado: res.resultado });
      },
    },
  },
});
