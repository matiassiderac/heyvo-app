import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Isotipo, Logotipo } from "@/components/heyvo/marca";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const valor = s['next'];
    return typeof valor === "string" && valor.startsWith("/") && !valor.startsWith("//")
      ? { next: valor }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Ingresar o crear tu cuenta — HEYVO" },
      {
        name: "description",
        content:
          "Entrá con tu correo o con Google para ver las expensas y los reclamos de tu unidad en HEYVO.",
      },
      { property: "og:title", content: "Ingresar o crear tu cuenta — HEYVO" },
      {
        property: "og:description",
        content: "Accedé al portal de tu consorcio con tu correo o con Google.",
      },
    ],
  }),
  component: Autenticacion,
});

function Autenticacion() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const destino = next ?? "/app";
  const irAlDestino = () => {
    if (next) {
      window.location.href = next;
      return;
    }
    void navigate({ to: "/app", replace: true });
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) irAlDestino();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  const ingresar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setCargando(false);
    if (error) {
      toast.error("No pudimos entrar con esos datos. Revisá el correo y la contraseña.");
      return;
    }
    irAlDestino();
  };

  const registrarse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${destino}`,
        data: { full_name: nombre },
      },
    });
    setCargando(false);
    if (error) {
      toast.error(
        error.message.includes("registered")
          ? "Ese correo ya tiene cuenta. Probá ingresando."
          : "No pudimos crear la cuenta. Probá de nuevo.",
      );
      return;
    }
    toast.success("Listo, tu cuenta quedó creada.");
    irAlDestino();
  };

  const conGoogle = async () => {
    setCargando(true);
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${destino}`,
    });
    if (resultado.error) {
      setCargando(false);
      toast.error("No pudimos abrir el ingreso con Google.");
      return;
    }
    if (resultado.redirected) return;
    irAlDestino();
  };

  return (
    <div className="flex min-h-screen flex-col bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-6 pb-12 pt-14">
        <Link to="/" className="flex items-center gap-3">
          <Isotipo className="h-10 w-10" />
          <Logotipo variante="claro" className="text-3xl" />
        </Link>

        <h1 className="mt-8 text-2xl font-semibold leading-tight">
          Entrá al portal de tu consorcio
        </h1>
        <p className="mt-2 text-sm text-primary-foreground/75">
          Usá el correo que tiene registrado la administración para que veas tu unidad.
        </p>

        <div className="mt-6 rounded-3xl bg-card p-5 text-card-foreground shadow-lg">
          <Tabs defaultValue="ingresar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ingresar">Ingresar</TabsTrigger>
              <TabsTrigger value="crear">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="ingresar">
              <form className="space-y-4" onSubmit={ingresar}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ingresar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="crear">
              <form className="space-y-4" onSubmit={registrarse}>
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Tu nombre</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-nuevo">Correo</Label>
                  <Input
                    id="email-nuevo"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password-nuevo">Contraseña</Label>
                  <Input
                    id="password-nuevo"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
                </div>
                <Button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear cuenta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={cargando}
            onClick={() => void conGoogle()}
          >
            Continuar con Google
          </Button>
        </div>

        <p className="mt-6 text-xs text-primary-foreground/70">
          Cuentas de prueba cargadas por la administración: mariana.demo@heyvo.app
          (propietaria) y admin.demo@heyvo.app (administración). Creá la cuenta con ese
          correo y quedás vinculado a la unidad.
        </p>
      </div>
    </div>
  );
}
