import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Isotipo, Logotipo } from "@/components/heyvo/marca";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type DetallesAutorizacion = {
  client?: { name?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthBeta = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: DetallesAutorizacion | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: DetallesAutorizacion | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: DetallesAutorizacion | null; error: { message: string } | null }>;
};

function oauthBeta(): OAuthBeta {
  return (supabase.auth as unknown as { oauth: OAuthBeta }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Falta authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
    return {};
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthBeta().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const inmediato = data?.redirect_url ?? data?.redirect_to;
    if (inmediato && !data?.client) throw redirect({ href: inmediato });
    return data;
  },
  component: Consentimiento,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-primary px-6 text-center text-sm text-primary-foreground">
      No pudimos cargar este pedido de conexión: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consentimiento() {
  const detalles = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombreCliente = detalles?.client?.name ?? "una aplicación";

  async function decidir(aprobar: boolean) {
    setOcupado(true);
    setError(null);
    const { data, error: err } = aprobar
      ? await oauthBeta().approveAuthorization(authorization_id)
      : await oauthBeta().denyAuthorization(authorization_id);
    if (err) {
      setOcupado(false);
      setError(err.message);
      return;
    }
    const destino = data?.redirect_url ?? data?.redirect_to;
    if (!destino) {
      setOcupado(false);
      setError("El servidor de autorización no devolvió una URL de retorno.");
      return;
    }
    window.location.href = destino;
  }

  return (
    <main className="flex min-h-screen flex-col bg-primary px-6 py-14 text-primary-foreground">
      <div className="mx-auto w-full max-w-[440px]">
        <div className="flex items-center gap-3">
          <Isotipo className="h-10 w-10" />
          <Logotipo variante="claro" className="text-3xl" />
        </div>

        <div className="mt-8 rounded-3xl bg-card p-6 text-card-foreground shadow-lg">
          <h1 className="text-xl font-semibold">Conectar {nombreCliente} a tu cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {nombreCliente} va a poder consultar tus expensas y tus reclamos, y crear
            reclamos nuevos en tu nombre. Solo accede a los datos de tu unidad.
          </p>

          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={ocupado}
              onClick={() => void decidir(true)}
            >
              {ocupado && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Autorizar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={ocupado}
              onClick={() => void decidir(false)}
            >
              Rechazar
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
