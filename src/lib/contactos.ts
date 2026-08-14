import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo-session";

export type ContactoApp = {
  id: string;
  nombre: string;
  detalle: string;
  telefono: string;
};

/**
 * Líneas públicas de emergencia (contenido de producto, no datos del consorcio).
 * No se guardan en la base porque son las mismas para todos los edificios.
 */
export const lineasEmergencia: ContactoApp[] = [
  { id: "bomberos", nombre: "Bomberos", detalle: "Incendio o humo", telefono: "100" },
  { id: "same", nombre: "Emergencias médicas", detalle: "SAME", telefono: "107" },
  { id: "policia", nombre: "Emergencias", detalle: "Policía / 911", telefono: "911" },
  {
    id: "gas",
    nombre: "Fuga de gas",
    detalle: "Guardia de gas, 24 h",
    telefono: "0800-333-4427",
  },
];

export function useContactosConsorcio() {
  const { sesion } = useDemo();

  const query = useQuery({
    queryKey: ["heyvo", "contactos", sesion?.userId],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<ContactoApp[]> => {
      const [{ data: consorcio, error }, { data: proveedores, error: errorProv }] =
        await Promise.all([
          supabase
            .from("consorcios")
            .select("id, nombre, telefono")
            .eq("id", sesion!.consorcioId!)
            .maybeSingle(),
          supabase
            .from("proveedores")
            .select("id, nombre, rubro, telefono")
            .eq("activo", true)
            .order("rubro"),
        ]);
      if (error) throw error;
      if (errorProv) throw errorProv;

      const lista: ContactoApp[] = [];
      if (consorcio?.telefono) {
        lista.push({
          id: consorcio.id,
          nombre: "Administración",
          detalle: consorcio.nombre,
          telefono: consorcio.telefono,
        });
      }
      for (const p of proveedores ?? []) {
        if (!p.telefono) continue;
        lista.push({ id: p.id, nombre: p.nombre, detalle: p.rubro, telefono: p.telefono });
      }
      return lista;
    },
  });

  return {
    contactos: query.data ?? [],
    cargando: query.isPending && !!sesion?.vinculado,
  };
}
