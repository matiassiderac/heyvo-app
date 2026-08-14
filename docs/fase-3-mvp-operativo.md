# Fase 3 — MVP operativo

## Cobros (entorno de prueba)

No hay credenciales reales de Mercado Pago: el proveedor se llama `mercadopago_sandbox`
y no genera ningún cobro. El ciclo es el mismo que tendrá la integración real:

1. El vecino toca **Pagar** en Expensas → `crearIntentoPago` (server function autenticada)
   crea una fila en `pago_intentos` con importe = total + intereses y una
   `referencia_externa` única.
2. Se abre el checkout en `/app/pago/{referencia}`.
3. Al confirmar, `simularNotificacionPago` firma un payload con
   `MERCADOPAGO_WEBHOOK_SECRET` y lo procesa con **el mismo código** que el webhook
   público `POST /api/public/webhooks/pagos/mercadopago`.
4. `procesarEventoPago` (en `src/lib/pagos.server.ts`):
   - rechaza con 401 si la firma HMAC-SHA256 no valida (verificado en pruebas);
   - guarda el evento en `pago_eventos` con `evento_id` **único** → un reintento del
     proveedor devuelve 200 sin volver a impactar la boleta (idempotencia);
   - si el intento ya no está `pendiente`, marca el evento como procesado y no hace nada
     (eventos fuera de orden);
   - si es aprobado, inserta en `pagos`; el trigger existente
     `private.aplicar_pago_a_boleta` marca la boleta como paga.

Para conectar Mercado Pago real solo cambian dos piezas: la creación del intento
(preference API con la cuenta del consorcio) y la verificación de firma del webhook.

## Bandeja omnicanal y derivación a persona

- El asistente guarda cada mensaje del vecino y su respuesta en `conversaciones` /
  `conversacion_mensajes`.
- La herramienta `derivar_a_persona` (o el botón "Hablar con una persona") pasa la
  conversación a `esperando_humano` y la deja en la bandeja de la administración.
- En `/admin/conversaciones` el equipo la **toma** (`humano`, queda asignada),
  responde y la cierra. La respuesta del operador aparece en el chat del vecino.

## Reglas de acceso (RLS)

| Tabla | Vecino | Administración |
| --- | --- | --- |
| `conversaciones` | ve, crea y actualiza solo las propias (`iniciada_por = auth.uid()`) | ve y actualiza todas las de su consorcio |
| `conversacion_mensajes` | lee las de sus conversaciones; escribe como `vecino`/`asistente` | lee las de su consorcio; escribe como `operador` |
| `pago_intentos` | ve y crea los de su unidad; **no** puede cambiar el estado | ve los del consorcio y puede iniciar uno para una unidad del edificio |
| `pago_eventos` | sin acceso | solo lectura de los eventos de su consorcio |

Los estados de pago los escribe únicamente el sistema (`service_role`) desde el webhook,
nunca el cliente.

## Datos del asistente

El asistente ya no usa fixtures: las herramientas de expensas, reclamos, espacios comunes
y avisos leen los datos reales de la sesión (traídos por el cliente con RLS aplicada).
Los contenidos de referencia (FAQs, tipos de certificado, teléfonos de emergencia)
siguen siendo contenido estático de producto.
