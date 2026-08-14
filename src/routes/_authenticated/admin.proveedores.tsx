import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { proveedores } from "@/data/demo";

export const Route = createFileRoute("/_authenticated/admin/proveedores")({
  head: () => ({
    meta: [
      { title: "Proveedores del consorcio — HEYVO" },
      {
        name: "description",
        content:
          "Listado de proveedores por rubro, contacto directo y cantidad de reclamos abiertos asignados a cada uno.",
      },
      { property: "og:title", content: "Proveedores del consorcio — HEYVO" },
      {
        property: "og:description",
        content: "Quién resuelve cada rubro y cuánto tiene en curso.",
      },
    ],
  }),
  component: Proveedores,
});

function Proveedores() {
  return (
    <AdminShell titulo="Proveedores" subtitulo="Quién resuelve cada rubro.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {proveedores.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.rubro}</p>
                </div>
                <Badge variant={p.ticketsAbiertos > 0 ? "default" : "secondary"}>
                  {p.ticketsAbiertos} abiertos
                </Badge>
              </div>
              <a
                href={`tel:${p.telefono}`}
                className="mt-3 flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                <Phone className="h-4 w-4" /> {p.telefono}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
