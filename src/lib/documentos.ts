import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo-session";

export const categoriasDocumento = ["Reglamento", "Balance", "Acta", "Seguro", "Contrato"] as const;

export type CategoriaDocumento = (typeof categoriasDocumento)[number];

export type DocumentoApp = {
  id: string;
  nombre: string;
  categoria: CategoriaDocumento;
  fecha: string;
  pesoBytes: number | null;
  soloPropietarios: boolean;
  storagePath: string;
};

const MAX_BYTES = 15 * 1024 * 1024;

export const esquemaDocumento = z.object({
  nombre: z.string().trim().min(3, "Poné un nombre de al menos 3 caracteres.").max(120),
  categoria: z.enum(categoriasDocumento),
  soloPropietarios: z.boolean(),
});

export type DatosDocumento = z.infer<typeof esquemaDocumento>;

export function formatPeso(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Nombre seguro para el bucket: sin acentos, espacios ni rutas relativas. */
function nombreArchivoSeguro(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

export function useDocumentos() {
  const { sesion } = useDemo();
  const query = useQuery({
    queryKey: ["heyvo", "documentos", sesion?.userId],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<DocumentoApp[]> => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, nombre, categoria, storage_path, peso_bytes, solo_propietarios, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d) => ({
        id: d.id,
        nombre: d.nombre,
        categoria: d.categoria as CategoriaDocumento,
        fecha: d.created_at,
        pesoBytes: d.peso_bytes != null ? Number(d.peso_bytes) : null,
        soloPropietarios: d.solo_propietarios,
        storagePath: d.storage_path,
      }));
    },
  });

  return {
    documentos: query.data ?? [],
    cargando: query.isPending && !!sesion?.vinculado,
    error: query.error,
  };
}

/** URL firmada de corta duración; el bucket es privado y la RLS de storage decide. */
export async function urlDescargaDocumento(storagePath: string) {
  const { data, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

export function useSubirDocumento() {
  const { sesion } = useDemo();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ archivo, datos }: { archivo: File; datos: DatosDocumento }) => {
      if (!sesion?.consorcioId) throw new Error("No tenés un consorcio asignado.");
      if (archivo.size > MAX_BYTES) throw new Error("El archivo supera los 15 MB.");
      const valores = esquemaDocumento.parse(datos);

      const path = `${sesion.consorcioId}/${crypto.randomUUID()}-${nombreArchivoSeguro(archivo.name)}`;
      const { error: errorSubida } = await supabase.storage
        .from("documentos")
        .upload(path, archivo, {
          upsert: false,
          ...(archivo.type ? { contentType: archivo.type } : {}),
        });
      if (errorSubida) throw errorSubida;

      const { error } = await supabase.from("documentos").insert({
        consorcio_id: sesion.consorcioId,
        nombre: valores.nombre,
        categoria: valores.categoria,
        storage_path: path,
        peso_bytes: archivo.size,
        solo_propietarios: valores.soloPropietarios,
        subido_por: sesion.userId,
      });
      if (error) {
        // No dejamos archivos huérfanos si falla el registro en la base.
        await supabase.storage.from("documentos").remove([path]);
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["heyvo", "documentos"] }),
  });
}

export function useEliminarDocumento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentoApp) => {
      const { error } = await supabase.from("documentos").delete().eq("id", doc.id);
      if (error) throw error;
      await supabase.storage.from("documentos").remove([doc.storagePath]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["heyvo", "documentos"] }),
  });
}
