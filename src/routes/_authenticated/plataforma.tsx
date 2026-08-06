import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MessagesSquare, Plug, Users } from "lucide-react";

import { BadgeDemo, Isotipo, Logotipo } from "@/components/heyvo/marca";
import { SelectorPerfil } from "@/components/heyvo/selector-perfil";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cuentas, integraciones } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/plataforma")({
  head: () => ({
    meta: [
      { title: "Panel HEYVO — Cuentas y plataforma" },
      {
        name: "description",
        content:
          "Vista de plataforma: administradoras activas, planes contratados, unidades bajo gestión e integraciones disponibles.",
      },
      { property: "og:title", content: "Panel HEYVO — Cuentas y plataforma" },
      {
        property: "og:description",
        content: "El estado del negocio multi-cliente de HEYVO en una pantalla.",
      },
    ],
  }),
  component: Plataforma,
});

function Plataforma() {
  const { rol, cargandoSesion } = useDemo();

  if (cargandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando el panel…
      </div>
    );
  }

  if (rol !== "superadmin") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Este panel es del equipo de HEYVO. Tu cuenta no tiene ese permiso.
      </div>
    );
  }
  const unidades = cuentas.reduce((a, c) => a + c.unidades, 0);
  const consorciosTotal = cuentas.reduce((a, c) => a + c.consorcios, 0);
  const mensajes = cuentas.reduce((a, c) => a + c.mensajesMes, 0);

  const kpis = [
    { label: "Administradoras", valor: String(cuentas.length), icon: Users },
    { label: "Consorcios", valor: String(consorciosTotal), icon: Building2 },
    { label: "Unidades", valor: unidades.toLocaleString("es-AR"), icon: Building2 },
    {
      label: "Mensajes del mes",
      valor: mensajes.toLocaleString("es-AR"),
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Isotipo className="h-8 w-8" />
            <Logotipo variante="claro" className="text-xl" />
          </Link>
          <span className="hidden text-xs text-primary-foreground/60 sm:inline">
            Plataforma
          </span>
          <div className="ml-auto flex items-center gap-2">
            <BadgeDemo />
            <SelectorPerfil variante="claro" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-semibold">Panel HEYVO</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas administradoras, uso del asistente e integraciones de la plataforma.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-4">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-accent" /> {k.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{k.valor}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Cuentas administradoras</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Consorcios</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Mensajes</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                      <TableCell className="text-sm">{c.plan}</TableCell>
                      <TableCell className="text-sm">{c.consorcios}</TableCell>
                      <TableCell className="text-sm">
                        {c.unidades.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.mensajesMes.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.estado === "activa"
                              ? "default"
                              : c.estado === "prueba"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {c.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Plug className="h-4 w-4 text-accent" /> Integraciones
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {integraciones.map((i) => (
                <div
                  key={i.nombre}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <span className="text-sm">{i.nombre}</span>
                  <Badge variant="outline">Pendiente</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              En esta fase las integraciones están listadas pero no conectadas. Cada
              consorcio usará su propia cuenta de Mercado Pago cuando activemos los pagos.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
