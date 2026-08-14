import { createHmac, timingSafeEqual } from "crypto";

/**
 * Adaptador de cobros — Fase 3 (sandbox).
 *
 * No hay credenciales reales de Mercado Pago: el proveedor `mercadopago_sandbox`
 * emula el ciclo de vida de un pago (intento -> checkout -> notificación webhook).
 * Cuando se conecte la cuenta real de cada consorcio, solo cambia la creación del
 * intento y la verificación de firma; el procesamiento del evento queda igual.
 */

export type ResultadoEvento =
  | { ok: true; resultado: "aplicado" | "rechazado" | "duplicado" | "ya_resuelto" | "sin_intento" }
  | { ok: false; status: number; mensaje: string };

export function firmarPayload(rawBody: string, secreto: string): string {
  return createHmac("sha256", secreto).update(rawBody).digest("hex");
}

export function firmaValida(rawBody: string, firma: string | null, secreto: string): boolean {
  if (!firma) return false;
  const esperada = Buffer.from(firmarPayload(rawBody, secreto));
  const recibida = Buffer.from(firma.trim());
  if (esperada.length !== recibida.length) return false;
  return timingSafeEqual(esperada, recibida);
}

type EventoPago = {
  id: string;
  type: string;
  data: {
    referencia_externa: string;
    estado: "aprobado" | "rechazado";
    importe?: number;
    detalle?: string;
  };
};

function parsearEvento(rawBody: string): EventoPago | null {
  try {
    const parsed = JSON.parse(rawBody) as Partial<EventoPago>;
    if (
      !parsed ||
      typeof parsed.id !== "string" ||
      typeof parsed.type !== "string" ||
      !parsed.data ||
      typeof parsed.data.referencia_externa !== "string" ||
      (parsed.data.estado !== "aprobado" && parsed.data.estado !== "rechazado")
    ) {
      return null;
    }
    return parsed as EventoPago;
  } catch {
    return null;
  }
}

/**
 * Procesa una notificación de pago. Es idempotente: el `id` del evento es único en
 * `pago_eventos`, así que un reintento del proveedor no vuelve a impactar la boleta.
 */
export async function procesarEventoPago(
  rawBody: string,
  firma: string | null,
): Promise<ResultadoEvento> {
  const secreto = process.env["MERCADOPAGO_WEBHOOK_SECRET"];
  if (!secreto) return { ok: false, status: 500, mensaje: "Falta el secreto del webhook" };
  if (!firmaValida(rawBody, firma, secreto))
    return { ok: false, status: 401, mensaje: "Firma inválida" };

  const evento = parsearEvento(rawBody);
  if (!evento) return { ok: false, status: 400, mensaje: "Payload inválido" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: intento } = await supabaseAdmin
    .from("pago_intentos")
    .select("id, boleta_id, unidad_id, importe, estado, creado_por, referencia_externa")
    .eq("referencia_externa", evento.data.referencia_externa)
    .maybeSingle();

  const { error: errorEvento } = await supabaseAdmin.from("pago_eventos").insert({
    evento_id: evento.id,
    intento_id: intento?.id ?? null,
    tipo: evento.type,
    estado_reportado: evento.data.estado,
    payload: JSON.parse(rawBody) as never,
    procesado: false,
  });

  if (errorEvento) {
    // 23505 = evento repetido: ya lo procesamos, respondemos 200 sin volver a aplicarlo.
    if (errorEvento.code === "23505") return { ok: true, resultado: "duplicado" };
    return { ok: false, status: 500, mensaje: errorEvento.message };
  }

  if (!intento) return { ok: true, resultado: "sin_intento" };

  const marcarProcesado = async () => {
    await supabaseAdmin
      .from("pago_eventos")
      .update({ procesado: true })
      .eq("evento_id", evento.id);
  };

  if (intento.estado !== "pendiente") {
    await marcarProcesado();
    return { ok: true, resultado: "ya_resuelto" };
  }

  if (evento.data.estado === "rechazado") {
    await supabaseAdmin
      .from("pago_intentos")
      .update({ estado: "rechazado", detalle: evento.data.detalle ?? "Pago rechazado" })
      .eq("id", intento.id);
    await marcarProcesado();
    return { ok: true, resultado: "rechazado" };
  }

  const { error: errorPago } = await supabaseAdmin.from("pagos").insert({
    boleta_id: intento.boleta_id,
    unidad_id: intento.unidad_id,
    pagado_por: intento.creado_por,
    importe: Number(evento.data.importe ?? intento.importe),
    medio: "mercadopago_sandbox",
    estado: "aprobado",
    referencia: intento.referencia_externa,
  });
  if (errorPago) return { ok: false, status: 500, mensaje: errorPago.message };

  await supabaseAdmin
    .from("pago_intentos")
    .update({ estado: "aprobado", detalle: "Pago acreditado (sandbox)" })
    .eq("id", intento.id);
  await marcarProcesado();

  return { ok: true, resultado: "aplicado" };
}
