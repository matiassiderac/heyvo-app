-- ========= enums =========
CREATE TYPE public.app_role AS ENUM (
  'residente','propietario','inquilino','encargado','administrador','operador','contable','proveedor','superadmin'
);
CREATE TYPE public.estado_boleta AS ENUM ('paga','pendiente','vencida');
CREATE TYPE public.prioridad_ticket AS ENUM ('alta','media','baja');
CREATE TYPE public.estado_ticket AS ENUM ('nuevo','validando','asignado','en_curso','esperando_tercero','resuelto','cerrado','reabierto');
CREATE TYPE public.canal_ticket AS ENUM ('app','whatsapp','email','telefono');

-- ========= util =========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ========= consorcios =========
CREATE TABLE public.consorcios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  direccion text NOT NULL,
  telefono text,
  es_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consorcios TO authenticated;
GRANT ALL ON public.consorcios TO service_role;
ALTER TABLE public.consorcios ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.torres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.torres TO authenticated;
GRANT ALL ON public.torres TO service_role;
ALTER TABLE public.torres ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  torre_id uuid REFERENCES public.torres(id) ON DELETE SET NULL,
  etiqueta text NOT NULL,
  piso text,
  depto text,
  m2 numeric,
  coeficiente numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consorcio_id, etiqueta)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades TO authenticated;
GRANT ALL ON public.unidades TO service_role;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

-- ========= identidad =========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  nombre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  unidad_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  user_id uuid UNIQUE,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  rol public.app_role NOT NULL DEFAULT 'residente',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX personas_email_unico ON public.personas (lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT ALL ON public.personas TO service_role;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========= funciones de permisos =========
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.mis_unidades(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT unidad_id FROM public.personas WHERE user_id = _user_id AND unidad_id IS NOT NULL AND activo;
$$;

CREATE OR REPLACE FUNCTION public.administra_consorcio(_user_id uuid, _consorcio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.personas p
    WHERE p.user_id = _user_id AND p.activo AND p.consorcio_id = _consorcio_id
      AND p.rol IN ('administrador','operador','contable','encargado')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.pertenece_consorcio(_user_id uuid, _consorcio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.personas p
    WHERE p.user_id = _user_id AND p.activo AND p.consorcio_id = _consorcio_id
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.consorcio_de_unidad(_unidad_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT consorcio_id FROM public.unidades WHERE id = _unidad_id;
$$;

-- ========= alta de usuario y vinculación al padrón =========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========= expensas =========
CREATE TABLE public.boletas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  unidad_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  periodo text NOT NULL,
  vencimiento date NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  interes numeric NOT NULL DEFAULT 0,
  estado public.estado_boleta NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidad_id, periodo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boletas TO authenticated;
GRANT ALL ON public.boletas TO service_role;
ALTER TABLE public.boletas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.boleta_conceptos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boleta_id uuid NOT NULL REFERENCES public.boletas(id) ON DELETE CASCADE,
  concepto text NOT NULL,
  monto numeric NOT NULL DEFAULT 0,
  orden int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boleta_conceptos TO authenticated;
GRANT ALL ON public.boleta_conceptos TO service_role;
ALTER TABLE public.boleta_conceptos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boleta_id uuid NOT NULL REFERENCES public.boletas(id) ON DELETE CASCADE,
  unidad_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  pagado_por uuid,
  importe numeric NOT NULL,
  medio text NOT NULL DEFAULT 'mercado_pago_demo',
  estado text NOT NULL DEFAULT 'aprobado',
  referencia text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagos TO authenticated;
GRANT ALL ON public.pagos TO service_role;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- ========= proveedores y reclamos =========
CREATE TABLE public.proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rubro text NOT NULL,
  telefono text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proveedores TO authenticated;
GRANT ALL ON public.proveedores TO service_role;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  unidad_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  unidad_etiqueta text,
  creado_por uuid,
  titulo text NOT NULL,
  categoria text NOT NULL,
  descripcion text NOT NULL,
  prioridad public.prioridad_ticket NOT NULL DEFAULT 'media',
  estado public.estado_ticket NOT NULL DEFAULT 'nuevo',
  canal public.canal_ticket NOT NULL DEFAULT 'app',
  proveedor_id uuid REFERENCES public.proveedores(id) ON DELETE SET NULL,
  vence_at timestamptz,
  csat int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE public.ticket_codigo_seq START 1050;
GRANT USAGE, SELECT ON SEQUENCE public.ticket_codigo_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_ticket_codigo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'TK-' || nextval('public.ticket_codigo_seq');
  END IF;
  RETURN NEW;
END; $$;
ALTER TABLE public.tickets ALTER COLUMN codigo DROP NOT NULL;
CREATE TRIGGER tickets_codigo BEFORE INSERT ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.set_ticket_codigo();

CREATE TABLE public.ticket_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  texto text NOT NULL,
  autor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_eventos TO authenticated;
GRANT ALL ON public.ticket_eventos TO service_role;
ALTER TABLE public.ticket_eventos ENABLE ROW LEVEL SECURITY;

-- ========= triggers updated_at =========
CREATE TRIGGER t_consorcios_upd BEFORE UPDATE ON public.consorcios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_personas_upd BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_boletas_upd BEFORE UPDATE ON public.boletas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_tickets_upd BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========= políticas =========
CREATE POLICY "perfil propio" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "actualiza perfil propio" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "roles propios" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "ve su consorcio" ON public.consorcios FOR SELECT TO authenticated
  USING (public.pertenece_consorcio(auth.uid(), id));
CREATE POLICY "administra su consorcio" ON public.consorcios FOR UPDATE TO authenticated
  USING (public.administra_consorcio(auth.uid(), id)) WITH CHECK (public.administra_consorcio(auth.uid(), id));

CREATE POLICY "ve torres" ON public.torres FOR SELECT TO authenticated
  USING (public.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona torres" ON public.torres FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), consorcio_id)) WITH CHECK (public.administra_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "ve unidades" ON public.unidades FOR SELECT TO authenticated
  USING (public.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona unidades" ON public.unidades FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), consorcio_id)) WITH CHECK (public.administra_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "ve su persona" ON public.personas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.administra_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona padron" ON public.personas FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), consorcio_id)) WITH CHECK (public.administra_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "ve sus boletas" ON public.boletas FOR SELECT TO authenticated
  USING (unidad_id IN (SELECT public.mis_unidades(auth.uid())) OR public.administra_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona boletas" ON public.boletas FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), consorcio_id)) WITH CHECK (public.administra_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "paga sus boletas" ON public.boletas FOR UPDATE TO authenticated
  USING (unidad_id IN (SELECT public.mis_unidades(auth.uid())))
  WITH CHECK (unidad_id IN (SELECT public.mis_unidades(auth.uid())));

CREATE POLICY "ve conceptos" ON public.boleta_conceptos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.boletas b WHERE b.id = boleta_id
    AND (b.unidad_id IN (SELECT public.mis_unidades(auth.uid())) OR public.administra_consorcio(auth.uid(), b.consorcio_id))));
CREATE POLICY "gestiona conceptos" ON public.boleta_conceptos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.boletas b WHERE b.id = boleta_id AND public.administra_consorcio(auth.uid(), b.consorcio_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.boletas b WHERE b.id = boleta_id AND public.administra_consorcio(auth.uid(), b.consorcio_id)));

CREATE POLICY "ve sus pagos" ON public.pagos FOR SELECT TO authenticated
  USING (unidad_id IN (SELECT public.mis_unidades(auth.uid()))
    OR public.administra_consorcio(auth.uid(), public.consorcio_de_unidad(unidad_id)));
CREATE POLICY "registra pago propio" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (pagado_por = auth.uid() AND unidad_id IN (SELECT public.mis_unidades(auth.uid())));
CREATE POLICY "gestiona pagos" ON public.pagos FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), public.consorcio_de_unidad(unidad_id)))
  WITH CHECK (public.administra_consorcio(auth.uid(), public.consorcio_de_unidad(unidad_id)));

CREATE POLICY "ve proveedores" ON public.proveedores FOR SELECT TO authenticated
  USING (public.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona proveedores" ON public.proveedores FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), consorcio_id)) WITH CHECK (public.administra_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "ve sus reclamos" ON public.tickets FOR SELECT TO authenticated
  USING (creado_por = auth.uid() OR unidad_id IN (SELECT public.mis_unidades(auth.uid()))
    OR public.administra_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "crea reclamo propio" ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (creado_por = auth.uid() AND public.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "cierra su reclamo" ON public.tickets FOR UPDATE TO authenticated
  USING (unidad_id IN (SELECT public.mis_unidades(auth.uid())))
  WITH CHECK (unidad_id IN (SELECT public.mis_unidades(auth.uid())));
CREATE POLICY "gestiona reclamos" ON public.tickets FOR ALL TO authenticated
  USING (public.administra_consorcio(auth.uid(), consorcio_id)) WITH CHECK (public.administra_consorcio(auth.uid(), consorcio_id));

CREATE POLICY "ve eventos" ON public.ticket_eventos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
    AND (t.creado_por = auth.uid() OR t.unidad_id IN (SELECT public.mis_unidades(auth.uid()))
      OR public.administra_consorcio(auth.uid(), t.consorcio_id))));
CREATE POLICY "agrega eventos" ON public.ticket_eventos FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
    AND (t.unidad_id IN (SELECT public.mis_unidades(auth.uid())) OR public.administra_consorcio(auth.uid(), t.consorcio_id))));