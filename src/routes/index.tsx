import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";

import { Isotipo, Logotipo } from "@/components/heyvo/marca";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HEYVO — El portal de tu consorcio" },
      {
        name: "description",
        content:
          "Expensas, reclamos, reservas y un asistente con inteligencia artificial para los vecinos y la administración de tu consorcio.",
      },
      { property: "og:title", content: "HEYVO — El portal de tu consorcio" },
      {
        property: "og:description",
        content:
          "Expensas, reclamos, reservas y un asistente que te entiende cuando escribís como hablás.",
      },
    ],
  }),
  component: Bienvenida,
});

function Bienvenida() {
  const navigate = useNavigate();
  const { autenticado, cargandoSesion } = useDemo();

  useEffect(() => {
    if (!cargandoSesion && autenticado) void navigate({ to: "/app", replace: true });
  }, [autenticado, cargandoSesion, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pb-12 pt-14">
        <div className="flex items-center gap-3">
          <Isotipo className="h-10 w-10" />
          <Logotipo variante="claro" className="text-3xl" />
        </div>

        <h1 className="mt-10 text-3xl font-semibold leading-tight">
          Tu consorcio, resuelto desde el celular.
        </h1>
        <p className="mt-3 text-sm text-primary-foreground/75">
          Expensas, reclamos, reservas y un asistente que te entiende cuando escribís
          como hablás.
        </p>

        <ul className="mt-6 space-y-2 text-sm text-primary-foreground/80">
          <li className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> Asistente virtual con
            inteligencia artificial
          </li>
          <li className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" /> Todo tu edificio en un solo
            lugar
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> Cada vecino ve sólo lo de su
            unidad
          </li>
        </ul>

        <div className="mt-10 space-y-3">
          <Button
            asChild
            size="lg"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/auth">
              Ingresar <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-center text-xs text-primary-foreground/70">
            ¿Todavía no tenés cuenta? Creala con el correo que registró tu
            administración.
          </p>
        </div>
      </div>
    </div>
  );
}
