CREATE OR REPLACE FUNCTION private.tickets_residente_solo_cierre()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
BEGIN
  IF private.administra_consorcio(auth.uid(), OLD.consorcio_id) THEN
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

CREATE OR REPLACE FUNCTION private.aplicar_pago_a_boleta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
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

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_persona public.personas%ROWTYPE;
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO v_persona FROM public.personas WHERE lower(email) = lower(NEW.email) LIMIT 1;
  IF FOUND THEN
    UPDATE public.personas SET user_id = NEW.id, updated_at = now() WHERE id = v_persona.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_persona.rol)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;