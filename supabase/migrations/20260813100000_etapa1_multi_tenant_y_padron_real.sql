-- Etapa 1: base multi-tenant (cuentas administradoras) + preferencias reales
-- + recordatorios de cobranza reales.

-- ========= cuentas administradoras =========
CREATE TYPE public.plan_cuenta AS ENUM ('base','pro','enterprise');
CREATE TYPE public.estado_cuenta AS ENUM ('activa','prueba','suspendida');

CREATE TABLE public.cuentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  plan public.plan_cuenta NOT NULL DEFAULT 'base',
  estado public.estado_cuenta NOT NULL DEFAULT 'prueba',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuentas TO authenticated;
GRANT ALL ON public.cuentas TO service_role;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cuenta_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id uuid NOT NULL REFERENCES public.cuentas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rol public.app_role NOT NULL DEFAULT 'administrador',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cuenta_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuenta_miembros TO authenticated;
GRANT ALL ON public.cuenta_miembros TO service_role;
ALTER TABLE public.cuenta_miembros ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.consorcios ADD COLUMN cuenta_id uuid REFERENCES public.cuentas(id) ON DELETE SET NULL;

CREATE TRIGGER t_cuentas_upd BEFORE UPDATE ON public.cuentas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Un administrador puede gestionar varios consorcios a través de una cuenta,
-- ademas del vinculo historico via personas (un admin dado de alta como
-- "persona" de un solo consorcio). Ambos caminos se combinan.
CREATE OR REPLACE FUNCTION private.administra_consorcio(_user_id uuid, _consorcio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.personas p
      WHERE p.user_id = _user_id AND p.activo AND p.consorcio_id = _consorcio_id
        AND p.rol IN ('administrador','operador','contable','encargado')
    ) OR EXISTS (
      SELECT 1 FROM public.cuenta_miembros cm
      JOIN public.consorcios c ON c.cuenta_id = cm.cuenta_id
      WHERE cm.user_id = _user_id AND c.id = _consorcio_id
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION private.pertenece_consorcio(_user_id uuid, _consorcio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.personas p
      WHERE p.user_id = _user_id AND p.activo AND p.consorcio_id = _consorcio_id
    ) OR EXISTS (
      SELECT 1 FROM public.cuenta_miembros cm
      JOIN public.consorcios c ON c.cuenta_id = cm.cuenta_id
      WHERE cm.user_id = _user_id AND c.id = _consorcio_id
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
    )
  );
$$;

CREATE POLICY "ve su cuenta" ON public.cuentas FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cuenta_miembros cm WHERE cm.cuenta_id = id AND cm.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );
CREATE POLICY "superadmin gestiona cuentas" ON public.cuentas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'));

CREATE POLICY "ve sus membresias" ON public.cuenta_miembros FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin')
  );
CREATE POLICY "superadmin gestiona membresias" ON public.cuenta_miembros FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'));

-- ========= preferencias de notificacion (reales, por usuario) =========
CREATE TABLE public.notificacion_prefs (
  user_id uuid PRIMARY KEY,
  avisos boolean NOT NULL DEFAULT true,
  vencimientos boolean NOT NULL DEFAULT true,
  reclamos boolean NOT NULL DEFAULT true,
  asambleas boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notificacion_prefs TO authenticated;
GRANT ALL ON public.notificacion_prefs TO service_role;
ALTER TABLE public.notificacion_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve sus preferencias" ON public.notificacion_prefs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "crea sus preferencias" ON public.notificacion_prefs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "actualiza sus preferencias" ON public.notificacion_prefs FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER t_notificacion_prefs_upd BEFORE UPDATE ON public.notificacion_prefs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========= recordatorios de cobranza (reales: quedan registrados, =========
-- ========= no se manda ningun email real todavia) =========
CREATE TABLE public.boleta_recordatorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boleta_id uuid NOT NULL REFERENCES public.boletas(id) ON DELETE CASCADE,
  enviado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.boleta_recordatorios TO authenticated;
GRANT ALL ON public.boleta_recordatorios TO service_role;
ALTER TABLE public.boleta_recordatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve recordatorios de su consorcio" ON public.boleta_recordatorios FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boletas b
    WHERE b.id = boleta_id AND private.administra_consorcio(auth.uid(), b.consorcio_id)
  ));
CREATE POLICY "registra recordatorio" ON public.boleta_recordatorios FOR INSERT TO authenticated
  WITH CHECK (
    enviado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.boletas b
      WHERE b.id = boleta_id AND private.administra_consorcio(auth.uid(), b.consorcio_id)
    )
  );

-- ========= datos de ejemplo: agrupar los consorcios demo en una cuenta =========
INSERT INTO public.cuentas (id, nombre, plan, estado) VALUES
 ('88888888-8888-4888-8888-000000000001','Administración Demo','pro','activa');

UPDATE public.consorcios SET cuenta_id = '88888888-8888-4888-8888-000000000001'
WHERE id IN (
  '11111111-1111-4111-8111-000000000001',
  '11111111-1111-4111-8111-000000000002'
);
