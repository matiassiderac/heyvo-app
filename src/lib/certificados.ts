import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { tiposCertificado } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export type EstadoCertificado = "en_proceso" | "listo";

export type SolicitudCertificadoApp = {
  id: string;
  tipoId: string;
  nombre: string;
  fecha: string;
  estado: EstadoCertificado;
  unidad: string | null;
  solicitadoPor: string;
};

export function useCertificados() {
  const { sesion } = useDemo();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["heyvo", "certificados", sesion?.userId],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<SolicitudCertificadoApp[]> => {
      const { data, error } = await supabase
        .from("certificado_solicitudes")
        .select("id, tipo_id, nombre, estado, created_at, solicitado_por, unidades(etiqueta)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        tipoId: c.tipo_id,
        nombre: c.nombre,
        fecha: c.created_at,
        estado: c.estado as EstadoCertificado,
        unidad: (c.unidades as { etiqueta: string } | null)?.etiqueta ?? null,
        solicitadoPor: c.solicitado_por,
      }));
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["heyvo", "certificados"] });

  const pedir = useMutation({
    mutationFn: async ({ tipoId, nombre }: { tipoId: string; nombre: string }) => {
      if (!sesion?.consorcioId) throw new Error("Tu cuenta todavía no está vinculada.");
      const tipo = tiposCertificado.find((t) => t.id === tipoId);
      const { error } = await supabase.from("certificado_solicitudes").insert({
        consorcio_id: sesion.consorcioId,
        unidad_id: sesion.unidadId,
        tipo_id: tipoId,
        nombre: tipo?.nombre ?? nombre,
        estado: "en_proceso",
        solicitado_por: sesion.userId,
      });
      // El trigger de la base rechaza el libre deuda si no sos propietario.
      if (error) throw error;
    },
    onSuccess: invalidar,
  });

  const marcarListo = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoCertificado }) => {
      const { error } = await supabase
        .from("certificado_solicitudes")
        .update({ estado })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });

  return {
    solicitudes: query.data ?? [],
    cargando: query.isPending && !!sesion?.vinculado,
    pedir: pedir.mutateAsync,
    pidiendo: pedir.isPending,
    cambiarEstado: marcarListo.mutateAsync,
    cambiandoEstado: marcarListo.isPending,
  };
}
