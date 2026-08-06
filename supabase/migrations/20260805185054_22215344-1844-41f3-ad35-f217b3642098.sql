-- 1) BOLETAS: quitar UPDATE directo de residentes
DROP POLICY IF EXISTS "paga sus boletas" ON public.boletas;

CREATE OR REPLACE FUNCTION public.aplicar_pago_a_boleta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boleta public.boletas%ROWTYPE;
  v_pagado numeric;
BEGIN
  SELECT * INTO v_boleta FROM public.boletas WHERE id = NEW.boleta_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.unidad_id IS DISTINCT FROM v_boleta.unidad_id THEN
    RAISE EXCEPTION 'El pago no corresponde a la unidad de la boleta';
  END IF;

  IF NEW.estado = 'aprobado' THEN
    SELECT COALESCE(SUM(importe), 0) INTO v_pagado
    FROM public.pagos WHERE boleta_id = NEW.boleta_id AND estado = 'aprobado';

    IF v_pagado >= (v_boleta.total + v_boleta.interes) THEN
      UPDATE public.boletas SET estado = 'paga', updated_at = now() WHERE id = NEW.boleta_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_pagos_aplica_boleta ON public.pagos;
CREATE TRIGGER t_pagos_aplica_boleta
AFTER INSERT ON public.pagos
FOR EACH ROW EXECUTE FUNCTION public.aplicar_pago_a_boleta();

-- 2) TICKETS: limitar columnas que puede tocar el residente
CREATE OR REPLACE FUNCTION public.tickets_residente_solo_cierre()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- los administradores del consorcio pueden todo
  IF public.administra_consorcio(auth.uid(), OLD.consorcio_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.codigo IS DISTINCT FROM OLD.codigo
     OR NEW.consorcio_id IS DISTINCT FROM OLD.consorcio_id
     OR NEW.unidad_id IS DISTINCT FROM OLD.unidad_id
     OR NEW.unidad_etiqueta IS DISTINCT FROM OLD.unidad_etiqueta
     OR NEW.creado_por IS DISTINCT FROM OLD.creado_por
     OR NEW.titulo IS DISTINCT FROM OLD.titulo
     OR NEW.categoria IS DISTINCT FROM OLD.categoria
     OR NEW.descripcion IS DISTINCT FROM OLD.descripcion
     OR NEW.prioridad IS DISTINCT FROM OLD.prioridad
     OR NEW.canal IS DISTINCT FROM OLD.canal
     OR NEW.proveedor_id IS DISTINCT FROM OLD.proveedor_id
     OR NEW.vence_at IS DISTINCT FROM OLD.vence_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Solo podés cerrar o reabrir tu reclamo y dejar tu valoración';
  END IF;

  IF NEW.estado IS DISTINCT FROM OLD.estado
     AND NEW.estado NOT IN ('cerrado', 'reabierto') THEN
    RAISE EXCEPTION 'Estado no permitido para el vecino';
  END IF;

  IF NEW.csat IS DISTINCT FROM OLD.csat
     AND NEW.csat IS NOT NULL
     AND (NEW.csat < 1 OR NEW.csat > 5) THEN
    RAISE EXCEPTION 'La valoración debe estar entre 1 y 5';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_tickets_residente_cierre ON public.tickets;
CREATE TRIGGER t_tickets_residente_cierre
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.tickets_residente_solo_cierre();

-- 3) Sacar las funciones SECURITY DEFINER del esquema expuesto por la API
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION public.mis_unidades(uuid) SET SCHEMA private;
ALTER FUNCTION public.administra_consorcio(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.pertenece_consorcio(uuid, uuid) SET SCHEMA private;
ALTER FUNCTION public.consorcio_de_unidad(uuid) SET SCHEMA private;
ALTER FUNCTION public.handle_new_user() SET SCHEMA private;
ALTER FUNCTION public.aplicar_pago_a_boleta() SET SCHEMA private;
ALTER FUNCTION public.tickets_residente_solo_cierre() SET SCHEMA private;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.mis_unidades(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.administra_consorcio(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.pertenece_consorcio(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.consorcio_de_unidad(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.aplicar_pago_a_boleta() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.tickets_residente_solo_cierre() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.mis_unidades(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.administra_consorcio(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.pertenece_consorcio(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.consorcio_de_unidad(uuid) TO authenticated, service_role;