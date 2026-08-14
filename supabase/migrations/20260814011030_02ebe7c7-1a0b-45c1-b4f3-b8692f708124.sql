CREATE TYPE public.estado_conversacion AS ENUM ('bot','esperando_humano','humano','cerrada');
CREATE TYPE public.autor_mensaje AS ENUM ('vecino','asistente','operador');
CREATE TYPE public.estado_pago_intento AS ENUM ('pendiente','aprobado','rechazado','expirado');

CREATE TABLE public.conversaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  unidad_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  unidad_etiqueta text,
  contacto text NOT NULL,
  iniciada_por uuid,
  canal public.canal_ticket NOT NULL DEFAULT 'app',
  asunto text NOT NULL DEFAULT 'Consulta desde el asistente',
  estado public.estado_conversacion NOT NULL DEFAULT 'bot',
  asignado_a uuid,
  ultimo_mensaje text,
  ultimo_mensaje_at timestamptz NOT NULL DEFAULT now(),
  sin_leer_admin integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.conversaciones TO authenticated;
GRANT ALL ON public.conversaciones TO service_role;
ALTER TABLE public.conversaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver conversaciones propias o del consorcio administrado"
ON public.conversaciones FOR SELECT TO authenticated
USING (iniciada_por = auth.uid() OR private.administra_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "Crear conversacion propia en mi consorcio"
ON public.conversaciones FOR INSERT TO authenticated
WITH CHECK (iniciada_por = auth.uid() AND private.pertenece_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "Actualizar conversacion propia o administrada"
ON public.conversaciones FOR UPDATE TO authenticated
USING (iniciada_por = auth.uid() OR private.administra_consorcio(auth.uid(), consorcio_id))
WITH CHECK (iniciada_por = auth.uid() OR private.administra_consorcio(auth.uid(), consorcio_id));

CREATE TRIGGER t_conversaciones_upd BEFORE UPDATE ON public.conversaciones
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_conversaciones_consorcio ON public.conversaciones (consorcio_id, ultimo_mensaje_at DESC);

CREATE TABLE public.conversacion_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id uuid NOT NULL REFERENCES public.conversaciones(id) ON DELETE CASCADE,
  autor public.autor_mensaje NOT NULL,
  user_id uuid,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.conversacion_mensajes TO authenticated;
GRANT ALL ON public.conversacion_mensajes TO service_role;
ALTER TABLE public.conversacion_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mensajes de conversaciones visibles"
ON public.conversacion_mensajes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversaciones c
  WHERE c.id = conversacion_id
    AND (c.iniciada_por = auth.uid() OR private.administra_consorcio(auth.uid(), c.consorcio_id))
));

CREATE POLICY "Escribir en conversaciones visibles"
ON public.conversacion_mensajes FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversaciones c
  WHERE c.id = conversacion_id
    AND (
      (c.iniciada_por = auth.uid() AND autor IN ('vecino','asistente'))
      OR (private.administra_consorcio(auth.uid(), c.consorcio_id) AND autor = 'operador')
    )
));

CREATE INDEX idx_conversacion_mensajes_conv ON public.conversacion_mensajes (conversacion_id, created_at);

CREATE TABLE public.pago_intentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  boleta_id uuid NOT NULL REFERENCES public.boletas(id) ON DELETE CASCADE,
  unidad_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  creado_por uuid NOT NULL,
  importe numeric(14,2) NOT NULL CHECK (importe > 0),
  proveedor text NOT NULL DEFAULT 'mercadopago_sandbox',
  referencia_externa text NOT NULL UNIQUE,
  estado public.estado_pago_intento NOT NULL DEFAULT 'pendiente',
  checkout_url text,
  detalle text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pago_intentos TO authenticated;
GRANT ALL ON public.pago_intentos TO service_role;
ALTER TABLE public.pago_intentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver intentos de mi unidad o del consorcio administrado"
ON public.pago_intentos FOR SELECT TO authenticated
USING (
  unidad_id IN (SELECT private.mis_unidades(auth.uid()))
  OR private.administra_consorcio(auth.uid(), consorcio_id)
);

CREATE POLICY "Crear intento de pago de mi unidad"
ON public.pago_intentos FOR INSERT TO authenticated
WITH CHECK (
  creado_por = auth.uid()
  AND unidad_id IN (SELECT private.mis_unidades(auth.uid()))
  AND private.pertenece_consorcio(auth.uid(), consorcio_id)
);

CREATE TRIGGER t_pago_intentos_upd BEFORE UPDATE ON public.pago_intentos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_pago_intentos_boleta ON public.pago_intentos (boleta_id, created_at DESC);

CREATE TABLE public.pago_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intento_id uuid REFERENCES public.pago_intentos(id) ON DELETE CASCADE,
  evento_id text NOT NULL UNIQUE,
  tipo text NOT NULL,
  estado_reportado text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  procesado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pago_eventos TO authenticated;
GRANT ALL ON public.pago_eventos TO service_role;
ALTER TABLE public.pago_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver eventos de pago del consorcio administrado"
ON public.pago_eventos FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pago_intentos i
  WHERE i.id = intento_id AND private.administra_consorcio(auth.uid(), i.consorcio_id)
));

CREATE INDEX idx_pago_eventos_intento ON public.pago_eventos (intento_id, created_at DESC);