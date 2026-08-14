import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo-session";

export type EstadoConversacion = "bot" | "esperando_humano" | "humano" | "cerrada";
export type AutorMensaje = "vecino" | "asistente" | "operador";

export type MensajeConversacion = {
  id: string;
  autor: AutorMensaje;
  texto: string;
  fecha: string;
};

export type ConversacionApp = {
  id: string;
  consorcioId: string;
  consorcioNombre: string | null;
  contacto: string;
  unidad: string | null;
  canal: "app" | "whatsapp" | "email" | "telefono";
  asunto: string;
  estado: EstadoConversacion;
  asignadoA: string | null;
  ultimoMensaje: string | null;
  ultimoMensajeAt: string;
  sinLeerAdmin: number;
};

type FilaConversacion = {
  id: string;
  consorcio_id: string;
  consorcios: { nombre: string } | { nombre: string }[] | null;
  contacto: string;
  unidad_etiqueta: string | null;
  canal: ConversacionApp["canal"];
  asunto: string;
  estado: EstadoConversacion;
  asignado_a: string | null;
  ultimo_mensaje: string | null;
  ultimo_mensaje_at: string;
  sin_leer_admin: number;
};

const nombreConsorcio = (c: FilaConversacion["consorcios"]) =>
  Array.isArray(c) ? (c[0]?.nombre ?? null) : (c?.nombre ?? null);

const mapear = (c: FilaConversacion): ConversacionApp => ({
  id: c.id,
  consorcioId: c.consorcio_id,
  consorcioNombre: nombreConsorcio(c.consorcios),
  contacto: c.contacto,
  unidad: c.unidad_etiqueta,
  canal: c.canal,
  asunto: c.asunto,
  estado: c.estado,
  asignadoA: c.asignado_a,
  ultimoMensaje: c.ultimo_mensaje,
  ultimoMensajeAt: c.ultimo_mensaje_at,
  sinLeerAdmin: c.sin_leer_admin,
});

const columnas =
  "id, consorcio_id, contacto, unidad_etiqueta, canal, asunto, estado, asignado_a, ultimo_mensaje, ultimo_mensaje_at, sin_leer_admin, consorcios(nombre)";

/** Última conversación del vecino, incluso cerrada, para no perder su historial visible. */
export function useMiConversacion() {
  const { sesion } = useDemo();
  const queryClient = useQueryClient();
  const userId = sesion?.userId;

  const conversacionQuery = useQuery({
    queryKey: ["heyvo", "mi-conversacion", userId],
    enabled: !!userId,
    // Necesario para enterarse de que un operador tomó la conversación (y mutear al bot).
    refetchInterval: 15000,
    queryFn: async (): Promise<ConversacionApp | null> => {
      const { data, error } = await supabase
        .from("conversaciones")
        .select(columnas)
        .eq("iniciada_por", userId!)
        .order("ultimo_mensaje_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? mapear(data as FilaConversacion) : null;
    },
  });

  const conversacion = conversacionQuery.data ?? null;

  const mensajesQuery = useQuery({
    queryKey: ["heyvo", "mensajes", conversacion?.id],
    enabled: !!conversacion,
    refetchInterval: conversacion && conversacion.estado !== "cerrada" ? 15000 : false,
    queryFn: async (): Promise<MensajeConversacion[]> => {
      const { data, error } = await supabase
        .from("conversacion_mensajes")
        .select("id, autor, texto, created_at")
        .eq("conversacion_id", conversacion!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m) => ({
        id: m.id,
        autor: m.autor as AutorMensaje,
        texto: m.texto,
        fecha: m.created_at,
      }));
    },
  });

  const asegurar = async (asunto: string): Promise<ConversacionApp | null> => {
    if (conversacion && conversacion.estado !== "cerrada") return conversacion;
    if (!sesion?.consorcioId || !sesion.userId) return null;
    const { data, error } = await supabase
      .from("conversaciones")
      .insert({
        consorcio_id: sesion.consorcioId,
        unidad_id: sesion.unidadId,
        unidad_etiqueta: sesion.unidadEtiqueta,
        contacto: sesion.nombre || sesion.email,
        iniciada_por: sesion.userId,
        canal: "app",
        asunto: asunto.slice(0, 120),
      })
      .select(columnas)
      .single();
    if (error) throw error;
    const nueva = mapear(data as FilaConversacion);
    queryClient.setQueryData(["heyvo", "mi-conversacion", userId], nueva);
    return nueva;
  };

  const registrarMensaje = useMutation({
    mutationFn: async (input: { autor: AutorMensaje; texto: string; asunto?: string }) => {
      const conv = await asegurar(input.asunto ?? input.texto);
      if (!conv) return null;
      const { error } = await supabase.from("conversacion_mensajes").insert({
        conversacion_id: conv.id,
        autor: input.autor,
        user_id: sesion?.userId ?? null,
        texto: input.texto,
      });
      if (error) throw error;
      await supabase
        .from("conversaciones")
        .update({
          ultimo_mensaje: input.texto.slice(0, 200),
          ultimo_mensaje_at: new Date().toISOString(),
          ...(input.autor === "vecino" ? { sin_leer_admin: conv.sinLeerAdmin + 1 } : {}),
        })
        .eq("id", conv.id);
      return conv.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["heyvo", "mi-conversacion"] });
      void queryClient.invalidateQueries({ queryKey: ["heyvo", "mensajes"] });
    },
  });

  const derivar = useMutation({
    mutationFn: async (motivo: string) => {
      const conv = await asegurar(motivo);
      if (!conv) throw new Error("Todavía no estás vinculado a un consorcio.");
      const { error } = await supabase
        .from("conversaciones")
        .update({
          estado: "esperando_humano",
          asunto: motivo.slice(0, 120),
          ultimo_mensaje: motivo.slice(0, 200),
          ultimo_mensaje_at: new Date().toISOString(),
          sin_leer_admin: conv.sinLeerAdmin + 1,
        })
        .eq("id", conv.id);
      if (error) throw error;
      return conv.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["heyvo", "mi-conversacion"] });
    },
  });

  const cerrarPropia = useMutation({
    mutationFn: async () => {
      if (!conversacion) return;
      const { error } = await supabase
        .from("conversaciones")
        .update({ estado: "cerrada" })
        .eq("id", conversacion.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["heyvo", "mi-conversacion"] });
      void queryClient.invalidateQueries({ queryKey: ["heyvo", "bandeja"] });
    },
  });

  return {
    conversacion,
    mensajes: mensajesQuery.data ?? [],
    cargando: conversacionQuery.isPending,
    registrarMensaje: (input: { autor: AutorMensaje; texto: string; asunto?: string }) =>
      registrarMensaje.mutateAsync(input),
    derivar: (motivo: string) => derivar.mutateAsync(motivo),
    derivando: derivar.isPending,
    cerrarPropia: () => cerrarPropia.mutateAsync(),
    cerrando: cerrarPropia.isPending,
  };
}

/** Bandeja omnicanal de la administración. */
export function useBandejaConversaciones() {
  const { sesion } = useDemo();
  const queryClient = useQueryClient();

  const bandejaQuery = useQuery({
    queryKey: ["heyvo", "bandeja", sesion?.userId],
    enabled: !!sesion?.esAdmin,
    refetchInterval: 20000,
    queryFn: async (): Promise<ConversacionApp[]> => {
      const { data, error } = await supabase
        .from("conversaciones")
        .select(columnas)
        .order("ultimo_mensaje_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => mapear(c as FilaConversacion));
    },
  });

  const mensajesDe = async (conversacionId: string): Promise<MensajeConversacion[]> => {
    const { data, error } = await supabase
      .from("conversacion_mensajes")
      .select("id, autor, texto, created_at")
      .eq("conversacion_id", conversacionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((m) => ({
      id: m.id,
      autor: m.autor as AutorMensaje,
      texto: m.texto,
      fecha: m.created_at,
    }));
  };

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["heyvo", "bandeja"] });
    void queryClient.invalidateQueries({ queryKey: ["heyvo", "mensajes-admin"] });
  };

  const tomar = useMutation({
    mutationFn: async (conversacionId: string) => {
      const { error } = await supabase
        .from("conversaciones")
        .update({ estado: "humano", asignado_a: sesion?.userId ?? null, sin_leer_admin: 0 })
        .eq("id", conversacionId);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });

  const responder = useMutation({
    mutationFn: async (input: { conversacionId: string; texto: string }) => {
      const { error } = await supabase.from("conversacion_mensajes").insert({
        conversacion_id: input.conversacionId,
        autor: "operador",
        user_id: sesion?.userId ?? null,
        texto: input.texto,
      });
      if (error) throw error;
      const { error: errorConv } = await supabase
        .from("conversaciones")
        .update({
          estado: "humano",
          asignado_a: sesion?.userId ?? null,
          ultimo_mensaje: input.texto.slice(0, 200),
          ultimo_mensaje_at: new Date().toISOString(),
          sin_leer_admin: 0,
        })
        .eq("id", input.conversacionId);
      if (errorConv) throw errorConv;
    },
    onSuccess: invalidar,
  });

  const cerrar = useMutation({
    mutationFn: async (conversacionId: string) => {
      const { error } = await supabase
        .from("conversaciones")
        .update({ estado: "cerrada", sin_leer_admin: 0 })
        .eq("id", conversacionId);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });

  return {
    conversaciones: bandejaQuery.data ?? [],
    cargando: bandejaQuery.isPending,
    mensajesDe,
    tomar: (id: string) => tomar.mutateAsync(id),
    responder: (conversacionId: string, texto: string) =>
      responder.mutateAsync({ conversacionId, texto }),
    cerrar: (id: string) => cerrar.mutateAsync(id),
    trabajando: tomar.isPending || responder.isPending || cerrar.isPending,
  };
}
