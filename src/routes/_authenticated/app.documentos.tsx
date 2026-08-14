import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Lock } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, formatFecha, tiposCertificado } from "@/data/demo";
import { puedePedirCertificado, useDemo } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/app/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos y certificados — HEYVO" },
      {
        name: "description",
        content:
          "Reglamento, balances y actas del consorcio, más el pedido de libre deuda y constancias de residencia.",
      },
      { property: "og:title", content: "Documentos y certificados — HEYVO" },
      {
        property: "og:description",
        content: "La documentación del edificio y tus certificados, siempre a mano.",
      },
    ],
  }),
  component: Documentos,
});

function Documentos() {
  const {
    rol,
    documentos,
    cargandoDocumentos,
    certificados,
    cargandoCertificados,
    pedirCertificado,
    descargarDocumento,
  } = useDemo();

  const descargar = (d: (typeof documentos)[number]) => {
    void descargarDocumento(d)
      .then((url) => window.open(url, "_blank", "noopener,noreferrer"))
      .catch(() => toast.error("No pudimos generar el enlace de descarga."));
  };

  const pedir = (tipoId: string, nombre: string) => {
    void pedirCertificado(tipoId, nombre)
      .then(() => toast.success(`Pedimos tu ${nombre.toLowerCase()}.`))
      .catch(() => toast.error("No pudimos registrar el pedido."));
  };

  return (
    <AppShell titulo="Documentos" subtitulo="Del edificio y de tu unidad.">
      <Tabs defaultValue="archivos">
        <TabsList className="w-full">
          <TabsTrigger value="archivos" className="flex-1">
            Archivos
          </TabsTrigger>
          <TabsTrigger value="certificados" className="flex-1">
            Certificados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="archivos" className="mt-4 space-y-2">
          {cargandoDocumentos ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando documentos…</p>
          ) : (
            <>
              {documentos.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Todavía no hay documentos publicados para tu consorcio.
                  </CardContent>
                </Card>
              )}
              {documentos.map((d) => (
                <Card key={d.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <FileText className="h-5 w-5 shrink-0 text-accent" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{d.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.categoria} · {formatFecha(d.fecha)} · {formatBytes(d.pesoBytes)}
                      </p>
                    </div>
                    {d.soloPropietarios && (
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <Lock className="h-3 w-3" /> Propietarios
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Descargar ${d.nombre}`}
                      onClick={() => descargar(d)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="certificados" className="mt-4 space-y-3">
          {tiposCertificado.map((t) => {
            const puede = puedePedirCertificado(rol, t.soloPropietarios);
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium">{t.nombre}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.descripcion}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Demora {t.demora}</p>
                  {puede ? (
                    <Button
                      size="sm"
                      className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={() => pedir(t.id, t.nombre)}
                    >
                      Pedir
                    </Button>
                  ) : (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Solo para propietarios.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {cargandoCertificados ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando tus pedidos…</p>
          ) : (
            certificados.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-2 text-sm font-semibold">Tus pedidos</h2>
                <div className="space-y-2">
                  {certificados.map((c) => (
                    <Card key={c.id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <p className="text-sm font-medium">{c.nombre}</p>
                          <p className="text-xs text-muted-foreground">{formatFecha(c.fecha)}</p>
                        </div>
                        <Badge variant={c.estado === "listo" ? "default" : "secondary"}>
                          {c.estado === "listo" ? "Listo" : "En proceso"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </TabsContent>
      </Tabs>
      <PieDemo />
    </AppShell>
  );
}
