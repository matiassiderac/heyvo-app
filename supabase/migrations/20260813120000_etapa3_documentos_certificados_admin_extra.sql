-- Etapa 3: documentos (con Supabase Storage) y certificados reales.
-- De paso: lo que había quedado afuera de la etapa 2 a proposito
-- (alta de amenities y de asambleas/votaciones desde el panel admin).

-- ========= documentos =========
CREATE TYPE public.categoria_documento AS ENUM ('Reglamento','Balance','Acta','Seguro','Contrato');

CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  categoria public.categoria_documento NOT NULL,
  storage_path text NOT NULL UNIQUE,
  peso_bytes bigint,
  solo_propietarios boolean NOT NULL DEFAULT false,
  subido_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve documentos segun su rol" ON public.documentos FOR SELECT TO authenticated
  USING (
    private.pertenece_consorcio(auth.uid(), consorcio_id)
    AND (
      NOT solo_propietarios
      OR private.administra_consorcio(auth.uid(), consorcio_id)
      OR EXISTS (
        SELECT 1 FROM public.personas p
        WHERE p.user_id = auth.uid() AND p.consorcio_id = documentos.consorcio_id AND p.rol = 'propietario'
      )
    )
  );
CREATE POLICY "gestiona documentos" ON public.documentos FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

-- Bucket privado para los archivos. Se sirven siempre con URL firmada.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Convención de path: {consorcio_id}/{uuid}.{ext}
CREATE POLICY "sube archivos si administra" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documentos'
    AND private.administra_consorcio(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "borra archivos si administra" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documentos'
    AND private.administra_consorcio(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
-- La lectura se valida contra el mismo permiso que la fila de metadata
-- (respeta solo_propietarios), no solo contra la carpeta del consorcio.
CREATE POLICY "lee archivos segun permiso del documento" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documentos'
    AND EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.storage_path = storage.objects.name
        AND private.pertenece_consorcio(auth.uid(), d.consorcio_id)
        AND (
          NOT d.solo_propietarios
          OR private.administra_consorcio(auth.uid(), d.consorcio_id)
          OR EXISTS (
            SELECT 1 FROM public.personas p
            WHERE p.user_id = auth.uid() AND p.consorcio_id = d.consorcio_id AND p.rol = 'propietario'
          )
        )
    )
  );

-- ========= certificados (solicitudes reales) =========
CREATE TYPE public.estado_certificado AS ENUM ('en_proceso','listo');

CREATE TABLE public.certificado_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  unidad_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  tipo_id text NOT NULL,
  nombre text NOT NULL,
  estado public.estado_certificado NOT NULL DEFAULT 'en_proceso',
  solicitado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificado_solicitudes TO authenticated;
GRANT ALL ON public.certificado_solicitudes TO service_role;
ALTER TABLE public.certificado_solicitudes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_certificado_solicitudes_upd BEFORE UPDATE ON public.certificado_solicitudes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "ve sus solicitudes o administra" ON public.certificado_solicitudes FOR SELECT TO authenticated
  USING (solicitado_por = auth.uid() OR private.administra_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "pide certificado" ON public.certificado_solicitudes FOR INSERT TO authenticated
  WITH CHECK (solicitado_por = auth.uid() AND private.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona solicitudes" ON public.certificado_solicitudes FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

-- El certificado de libre deuda es solo para propietarios (y para quien
-- administra). Se valida en el servidor, no solo en la UI, porque un
-- inquilino podría intentar pedirlo llamando la API directo.
CREATE OR REPLACE FUNCTION private.valida_rol_certificado()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, public AS $$
DECLARE
  v_rol public.app_role;
BEGIN
  IF NEW.tipo_id = 'libre-deuda' AND NOT private.administra_consorcio(NEW.solicitado_por, NEW.consorcio_id) THEN
    SELECT p.rol INTO v_rol FROM public.personas p
    WHERE p.user_id = NEW.solicitado_por AND p.consorcio_id = NEW.consorcio_id AND p.activo
    LIMIT 1;
    IF v_rol IS DISTINCT FROM 'propietario' THEN
      RAISE EXCEPTION 'El certificado de libre deuda es solo para propietarios.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER t_certificado_valida_rol BEFORE INSERT ON public.certificado_solicitudes
FOR EACH ROW EXECUTE FUNCTION private.valida_rol_certificado();

-- ========= documentos de ejemplo (metadata solamente; sin archivo real) =========
-- No se insertan filas de ejemplo: sin un archivo real en Storage detrás,
-- un botón de descarga que "funciona" pero rompe sería peor que una lista
-- vacía. La administración los sube desde /admin/documentos.
