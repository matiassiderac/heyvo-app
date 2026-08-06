import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MailQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/app")({
  component: PortalResidente,
});

function PortalResidente() {
  const { sesion, cargandoSesion, salir } = useDemo();

  if (cargandoSesion || !sesion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando tu unidad…
      </div>
    );
  }

  if (!sesion.vinculado) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <MailQuestion className="mx-auto h-8 w-8 text-accent" />
            <h1 className="mt-3 text-lg font-semibold">Todavía no encontramos tu unidad</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entraste con {sesion.email}, pero ese correo no figura en el padrón de
              ningún consorcio. Pedile a tu administración que lo cargue y volvé a
              entrar.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void salir()}
            >
              Salir y probar con otro correo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
