CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid())
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.mis_unidades(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT unidad_id FROM public.personas
  WHERE user_id = _user_id AND unidad_id IS NOT NULL AND activo
    AND (auth.uid() IS NULL OR _user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.administra_consorcio(_user_id uuid, _consorcio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.personas p
      WHERE p.user_id = _user_id AND p.activo AND p.consorcio_id = _consorcio_id
        AND p.rol IN ('administrador','operador','contable','encargado')
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.pertenece_consorcio(_user_id uuid, _consorcio_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (auth.uid() IS NULL OR _user_id = auth.uid()) AND (
    EXISTS (
      SELECT 1 FROM public.personas p
      WHERE p.user_id = _user_id AND p.activo AND p.consorcio_id = _consorcio_id
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = 'superadmin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.consorcio_de_unidad(_unidad_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT consorcio_id FROM public.unidades WHERE id = _unidad_id;
$$;