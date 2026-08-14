import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const crearIntentoPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ boletaId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: boleta, error } = await context.supabase
      .from("boletas")
      .select("id, consorcio_id, unidad_id, periodo, total, interes, estado")
      .eq("id", data.boletaId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!boleta) throw new Error("No encontramos esa boleta.");
    if (boleta.estado === "paga") throw new Error("Esa boleta ya está paga.");

    const importe = Number(boleta.total) + Number(boleta.interes ?? 0);
    const referencia = `HEYVO-${boleta.id.slice(0, 8)}-${Date.now()}`;

    const { data: intento, error: errorIntento } = await context.supabase
      .from("pago_intentos")
      .insert({
        consorcio_id: boleta.consorcio_id,
        boleta_id: boleta.id,
        unidad_id: boleta.unidad_id,
        creado_por: context.userId,
        importe,
        proveedor: "mercadopago_sandbox",
        referencia_externa: referencia,
        checkout_url: `/app/pago/${referencia}`,
      })
      .select("id, referencia_externa, importe, estado")
      .single();
    if (errorIntento) throw new Error(errorIntento.message);

    return { ...intento, periodo: boleta.periodo };
  });

/**
 * Sandbox: emula la notificación que enviaría Mercado Pago. Firma el payload con el
 * mismo secreto que valida el webhook público y reusa exactamente el mismo procesamiento.
 */
export const simularNotificacionPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        intentoId: z.string().uuid(),
        resultado: z.enum(["aprobado", "rechazado"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: intento, error } = await context.supabase
      .from("pago_intentos")
      .select("id, referencia_externa, importe, estado, creado_por")
      .eq("id", data.intentoId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!intento) throw new Error("No encontramos ese intento de pago.");
    if (intento.creado_por !== context.userId)
      throw new Error("Ese intento de pago no es tuyo.");

    const { firmarPayload, procesarEventoPago } = await import("@/lib/pagos.server");
    const secreto = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
    if (!secreto) throw new Error("Falta configurar el secreto del webhook de pagos.");

    const body = JSON.stringify({
      id: `sandbox-${intento.id}-${data.resultado}`,
      type: "payment.updated",
      data: {
        referencia_externa: intento.referencia_externa,
        estado: data.resultado,
        importe: Number(intento.importe),
        detalle:
          data.resultado === "aprobado"
            ? "Pago acreditado (sandbox)"
            : "El medio de pago rechazó la operación (sandbox)",
      },
    });

    const res = await procesarEventoPago(body, firmarPayload(body, secreto));
    if (!res.ok) throw new Error(res.mensaje);
    return { resultado: res.resultado };
  });

export const estadoIntentoPago = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ referencia: z.string().min(6) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: intento, error } = await context.supabase
      .from("pago_intentos")
      .select("id, referencia_externa, importe, estado, detalle, boleta_id, created_at")
      .eq("referencia_externa", data.referencia)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!intento) throw new Error("No encontramos ese intento de pago.");

    const { data: boleta } = await context.supabase
      .from("boletas")
      .select("periodo, estado")
      .eq("id", intento.boleta_id)
      .maybeSingle();

    return { ...intento, periodo: boleta?.periodo ?? "", estadoBoleta: boleta?.estado ?? null };
  });
