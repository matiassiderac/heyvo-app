import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone } from "lucide-react";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roles } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/personas")({
  head: () => ({
    meta: [
      { title: "Padrón de vecinos — HEYVO" },
      {
        name: "description",
        content:
          "Padrón de propietarios, inquilinos y personal del consorcio con rol, unidad y datos de contacto.",
      },
      { property: "og:title", content: "Padrón de vecinos — HEYVO" },
      {
        property: "og:description",
        content: "Quién es quién en el edificio, con su rol y su unidad.",
      },
    ],
  }),
  component: Personas,
});

function Personas() {
  const { personas, cargandoPersonas } = useDemo();
  const [busqueda, setBusqueda] = useState("");
  const filtradas = personas.filter((p) =>
    `${p.nombre} ${p.unidadEtiqueta ?? ""} ${p.email}`
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  return (
    <AdminShell titulo="Padrón" subtitulo="Personas vinculadas a los consorcios.">
      <Card>
        <CardContent className="p-4">
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, unidad o correo"
            className="mb-4 max-w-xs"
            aria-label="Buscar personas"
          />
          {cargandoPersonas ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando padrón…</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Contacto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {roles.find((r) => r.id === p.rol)?.nombre ?? p.rol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.unidadEtiqueta ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> {p.email}
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {p.telefono ?? "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        No hay personas con esos filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}
