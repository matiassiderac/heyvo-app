DROP POLICY "Crear intento de pago de mi unidad" ON public.pago_intentos;

CREATE POLICY "Crear intento de pago propio o del consorcio administrado"
ON public.pago_intentos FOR INSERT TO authenticated
WITH CHECK (
  creado_por = auth.uid()
  AND (
    (unidad_id IN (SELECT private.mis_unidades(auth.uid()))
      AND private.pertenece_consorcio(auth.uid(), consorcio_id))
    OR private.administra_consorcio(auth.uid(), consorcio_id)
  )
);