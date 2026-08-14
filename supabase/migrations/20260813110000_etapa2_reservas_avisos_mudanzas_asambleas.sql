-- Etapa 2: operacion del edificio con datos reales
-- (amenities, reservas, avisos, mudanzas, asambleas + votaciones + votos)

-- ========= amenities (espacios comunes, por consorcio) =========
CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  capacidad int NOT NULL DEFAULT 1,
  reglas text[] NOT NULL DEFAULT '{}',
  franjas text[] NOT NULL DEFAULT '{}',
  requiere_deposito numeric,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amenities TO authenticated;
GRANT ALL ON public.amenities TO service_role;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve amenities de su consorcio" ON public.amenities FOR SELECT TO authenticated
  USING (private.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona amenities" ON public.amenities FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

-- ========= reservas =========
CREATE TYPE public.estado_reserva AS ENUM ('confirmada','pendiente','cancelada');

CREATE TABLE public.reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  unidad_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  franja text NOT NULL,
  estado public.estado_reserva NOT NULL DEFAULT 'confirmada',
  creado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservas TO authenticated;
GRANT ALL ON public.reservas TO service_role;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Un mismo turno no se puede reservar dos veces (salvo que se haya cancelado).
CREATE UNIQUE INDEX reservas_turno_unico ON public.reservas (amenity_id, fecha, franja)
  WHERE estado <> 'cancelada';

CREATE POLICY "ve reservas de su unidad o administra" ON public.reservas FOR SELECT TO authenticated
  USING (
    unidad_id IN (SELECT private.mis_unidades(auth.uid()))
    OR private.administra_consorcio(auth.uid(), consorcio_id)
  );
CREATE POLICY "reserva su unidad" ON public.reservas FOR INSERT TO authenticated
  WITH CHECK (
    creado_por = auth.uid()
    AND unidad_id IN (SELECT private.mis_unidades(auth.uid()))
    AND private.pertenece_consorcio(auth.uid(), consorcio_id)
  );
CREATE POLICY "cancela su reserva" ON public.reservas FOR UPDATE TO authenticated
  USING (unidad_id IN (SELECT private.mis_unidades(auth.uid())))
  WITH CHECK (unidad_id IN (SELECT private.mis_unidades(auth.uid())));
CREATE POLICY "gestiona reservas" ON public.reservas FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

-- ========= avisos =========
CREATE TYPE public.tipo_aviso AS ENUM ('informativo','urgente','mantenimiento');

CREATE TABLE public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  tipo public.tipo_aviso NOT NULL DEFAULT 'informativo',
  publicado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve avisos de su consorcio" ON public.avisos FOR SELECT TO authenticated
  USING (private.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona avisos" ON public.avisos FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

CREATE TABLE public.aviso_lecturas (
  aviso_id uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  leido_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (aviso_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.aviso_lecturas TO authenticated;
GRANT ALL ON public.aviso_lecturas TO service_role;
ALTER TABLE public.aviso_lecturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve sus lecturas" ON public.aviso_lecturas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "marca sus lecturas" ON public.aviso_lecturas FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "actualiza sus lecturas" ON public.aviso_lecturas FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========= mudanzas, fletes y obras =========
CREATE TYPE public.tipo_mudanza AS ENUM ('mudanza','flete','obra');
CREATE TYPE public.estado_mudanza AS ENUM ('solicitada','aprobada','rechazada');

CREATE TABLE public.mudanzas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  unidad_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo public.tipo_mudanza NOT NULL,
  fecha date NOT NULL,
  franja text NOT NULL,
  estado public.estado_mudanza NOT NULL DEFAULT 'aprobada',
  codigo text,
  solicitado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mudanzas TO authenticated;
GRANT ALL ON public.mudanzas TO service_role;
ALTER TABLE public.mudanzas ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE public.mudanza_codigo_seq START 1;
GRANT USAGE, SELECT ON SEQUENCE public.mudanza_codigo_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_mudanza_codigo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := 'HEYVO-MU' || nextval('public.mudanza_codigo_seq');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER t_mudanzas_codigo BEFORE INSERT ON public.mudanzas
FOR EACH ROW EXECUTE FUNCTION public.set_mudanza_codigo();

CREATE POLICY "ve mudanzas de su unidad o administra" ON public.mudanzas FOR SELECT TO authenticated
  USING (
    unidad_id IN (SELECT private.mis_unidades(auth.uid()))
    OR private.administra_consorcio(auth.uid(), consorcio_id)
  );
CREATE POLICY "pide mudanza de su unidad" ON public.mudanzas FOR INSERT TO authenticated
  WITH CHECK (
    solicitado_por = auth.uid()
    AND unidad_id IN (SELECT private.mis_unidades(auth.uid()))
  );
CREATE POLICY "gestiona mudanzas" ON public.mudanzas FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

-- ========= asambleas, votaciones y votos =========
CREATE TYPE public.modalidad_asamblea AS ENUM ('presencial','virtual','mixta');
CREATE TYPE public.estado_asamblea AS ENUM ('convocada','en_curso','cerrada');

CREATE TABLE public.asambleas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id uuid NOT NULL REFERENCES public.consorcios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  fecha timestamptz NOT NULL,
  modalidad public.modalidad_asamblea NOT NULL,
  estado public.estado_asamblea NOT NULL DEFAULT 'convocada',
  temario text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asambleas TO authenticated;
GRANT ALL ON public.asambleas TO service_role;
ALTER TABLE public.asambleas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER t_asambleas_upd BEFORE UPDATE ON public.asambleas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "ve asambleas de su consorcio" ON public.asambleas FOR SELECT TO authenticated
  USING (private.pertenece_consorcio(auth.uid(), consorcio_id));
CREATE POLICY "gestiona asambleas" ON public.asambleas FOR ALL TO authenticated
  USING (private.administra_consorcio(auth.uid(), consorcio_id))
  WITH CHECK (private.administra_consorcio(auth.uid(), consorcio_id));

CREATE TABLE public.votaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asamblea_id uuid NOT NULL REFERENCES public.asambleas(id) ON DELETE CASCADE,
  tema text NOT NULL,
  opciones text[] NOT NULL,
  orden int NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votaciones TO authenticated;
GRANT ALL ON public.votaciones TO service_role;
ALTER TABLE public.votaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve votaciones de su consorcio" ON public.votaciones FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.asambleas a WHERE a.id = asamblea_id
      AND private.pertenece_consorcio(auth.uid(), a.consorcio_id)
  ));
CREATE POLICY "gestiona votaciones" ON public.votaciones FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.asambleas a WHERE a.id = asamblea_id
      AND private.administra_consorcio(auth.uid(), a.consorcio_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.asambleas a WHERE a.id = asamblea_id
      AND private.administra_consorcio(auth.uid(), a.consorcio_id)
  ));

CREATE TABLE public.votos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  votacion_id uuid NOT NULL REFERENCES public.votaciones(id) ON DELETE CASCADE,
  unidad_id uuid NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  opcion text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (votacion_id, unidad_id)
);
GRANT SELECT, INSERT, UPDATE ON public.votos TO authenticated;
GRANT ALL ON public.votos TO service_role;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ve su voto" ON public.votos FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "ve resultados cuando cierra o administra" ON public.votos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.votaciones v JOIN public.asambleas a ON a.id = v.asamblea_id
    WHERE v.id = votacion_id
      AND private.pertenece_consorcio(auth.uid(), a.consorcio_id)
      AND (a.estado = 'cerrada' OR private.administra_consorcio(auth.uid(), a.consorcio_id))
  ));
CREATE POLICY "vota su unidad" ON public.votos FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND unidad_id IN (SELECT private.mis_unidades(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.votaciones v JOIN public.asambleas a ON a.id = v.asamblea_id
      WHERE v.id = votacion_id AND a.estado <> 'cerrada'
    )
  );
CREATE POLICY "cambia su voto hasta el cierre" ON public.votos FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND unidad_id IN (SELECT private.mis_unidades(auth.uid())))
  WITH CHECK (
    user_id = auth.uid()
    AND unidad_id IN (SELECT private.mis_unidades(auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.votaciones v JOIN public.asambleas a ON a.id = v.asamblea_id
      WHERE v.id = votacion_id AND a.estado <> 'cerrada'
    )
  );

-- ========= datos de ejemplo (consorcio 1: Edificio Rivadavia 2450) =========
INSERT INTO public.amenities (id, consorcio_id, nombre, descripcion, capacidad, reglas, franjas, requiere_deposito) VALUES
 ('99999999-9999-4999-8999-000000000001','11111111-1111-4111-8111-000000000001','SUM',
  'Salón de usos múltiples con cocina y parrilla interior.', 40,
  ARRAY['Reserva con hasta 30 días de anticipación.','Se libera a las 2 de la mañana.','Depósito reintegrable de $60.000.','No se puede reservar con expensas vencidas.'],
  ARRAY['12:00 a 17:00','18:00 a 23:00'], 60000),
 ('99999999-9999-4999-8999-000000000002','11111111-1111-4111-8111-000000000001','Parrilla de terraza',
  'Parrilla al aire libre con mesa para 10 personas.', 10,
  ARRAY['Una reserva por unidad por semana.','Dejar limpio al retirarse.'],
  ARRAY['12:00 a 16:00','20:00 a 00:00'], NULL),
 ('99999999-9999-4999-8999-000000000003','11111111-1111-4111-8111-000000000001','Sala de coworking',
  'Seis puestos con wifi y sala de reuniones chica.', 6,
  ARRAY['Hasta 4 horas por día.','Sin llamadas en el sector abierto.'],
  ARRAY['08:00 a 12:00','13:00 a 17:00','18:00 a 21:00'], NULL),
 ('99999999-9999-4999-8999-000000000004','11111111-1111-4111-8111-000000000001','Laundry',
  'Dos lavarropas y una secadora.', 2,
  ARRAY['Turnos de 2 horas.','Retirar la ropa al finalizar.'],
  ARRAY['09:00 a 11:00','11:00 a 13:00','17:00 a 19:00'], NULL);

INSERT INTO public.avisos (id, consorcio_id, titulo, cuerpo, tipo, created_at) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001','11111111-1111-4111-8111-000000000001','Corte de agua programado',
  'El jueves de 9 a 13 se corta el agua por reparación de la bomba. Te recomendamos juntar agua la noche anterior.',
  'mantenimiento','2026-08-04T12:00:00Z'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002','11111111-1111-4111-8111-000000000001','Nueva empresa de limpieza',
  'Desde el 1 de agosto la limpieza de espacios comunes queda a cargo de Servicios Norte. Los días y horarios no cambian.',
  'informativo','2026-08-01T12:00:00Z');

INSERT INTO public.asambleas (id, consorcio_id, titulo, fecha, modalidad, estado, temario) VALUES
 ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001','11111111-1111-4111-8111-000000000001','Asamblea ordinaria de agosto',
  '2026-08-20T22:00:00Z','mixta','convocada',
  ARRAY['Aprobación del balance de julio.','Presupuesto para impermeabilizar la terraza.','Reemplazo de luminarias por LED.']);

INSERT INTO public.votaciones (id, asamblea_id, tema, opciones, orden) VALUES
 ('cccccccc-cccc-4ccc-8ccc-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
  'Impermeabilización de terraza: tres presupuestos',
  ARRAY['Presupuesto A','Presupuesto B','Presupuesto C','Abstención'], 1),
 ('cccccccc-cccc-4ccc-8ccc-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-000000000001',
  'Cambio de luminarias a LED', ARRAY['A favor','En contra','Abstención'], 2);
