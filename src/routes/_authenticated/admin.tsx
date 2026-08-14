import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin")({
  component: PortalAdmin,
});

function PortalAdmin() {
  const { sesion, cargandoSesion } = useDemo();

  if (cargandoSesion || !sesion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando tu panel…
      </div>
    );
  }

  if (!sesion.esAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-accent" />
            <h1 className="mt-3 text-lg font-semibold">Esta parte no es para vos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              El portal de administración es para el equipo que gestiona el consorcio.
              Desde tu portal tenés todo lo de tu unidad.
            </p>
            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/app">Ir a mi portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
}
