import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "@/lib/demo-session";

export const esquemaPrefs = z.object({
  avisos: z.boolean(),
  vencimientos: z.boolean(),
  reclamos: z.boolean(),
  asambleas: z.boolean(),
});

export type PrefsNotificacion = z.infer<typeof esquemaPrefs>;

const PREFS_POR_DEFECTO: PrefsNotificacion = {
  avisos: true,
  vencimientos: true,
  reclamos: true,
  asambleas: false,
};

export function usePrefsNotificacion() {
  const { sesion } = useDemo();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["heyvo", "notificacion-prefs", sesion?.userId],
    enabled: !!sesion,
    queryFn: async (): Promise<PrefsNotificacion> => {
      const { data, error } = await supabase
        .from("notificacion_prefs")
        .select("avisos, vencimientos, reclamos, asambleas")
        .eq("user_id", sesion!.userId)
        .maybeSingle();
      if (error) throw error;
      return data ? esquemaPrefs.parse(data) : PREFS_POR_DEFECTO;
    },
  });

  const guardar = useMutation({
    mutationFn: async (prefs: PrefsNotificacion) => {
      if (!sesion) throw new Error("Sesión no disponible.");
      const valores = esquemaPrefs.parse(prefs);
      const { error } = await supabase
        .from("notificacion_prefs")
        .upsert({ user_id: sesion.userId, ...valores }, { onConflict: "user_id" });
      if (error) throw error;
      return valores;
    },
    onSuccess: (valores) => {
      queryClient.setQueryData(["heyvo", "notificacion-prefs", sesion?.userId], valores);
    },
  });

  return {
    prefs: query.data ?? PREFS_POR_DEFECTO,
    cargando: query.isPending && !!sesion,
    guardar: guardar.mutateAsync,
    guardando: guardar.isPending,
  };
}
