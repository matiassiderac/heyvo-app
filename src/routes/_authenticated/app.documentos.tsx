import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, Lock } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFecha, tiposCertificado } from "@/data/demo";
import { useCertificados } from "@/lib/certificados";
import {
  formatPeso,
  urlDescargaDocumento,
  useDocumentos,
  type DocumentoApp,
} from "@/lib/documentos";
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
  const { rol, sesion } = useDemo();
  const { documentos, cargando } = useDocumentos();
  const { solicitudes, cargando: cargandoCerts, pedir, pidiendo } = useCertificados();
  const [descargando, setDescargando] = useState<string | null>(null);

  const mias = solicitudes.filter((s) => s.solicitadoPor === sesion?.userId);

  const descargar = async (d: DocumentoApp) => {
    setDescargando(d.id);
    try {
      const url = await urlDescargaDocumento(d.storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("No pudimos abrir el archivo. Puede que no tengas permiso.");
    } finally {
      setDescargando(null);
    }
  };

  const pedirCertificado = async (tipoId: string, nombre: string) => {
    try {
      await pedir({ tipoId, nombre });
      toast.success(`Pedimos tu ${nombre.toLowerCase()}. Te avisamos cuando esté.`);
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.includes("propietario")
          ? "El libre deuda es solo para propietarios."
          : "No pudimos registrar el pedido.",
      );
    }
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
          {cargando && <p className="text-sm text-muted-foreground">Buscando archivos…</p>}
          {!cargando && documentos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay documentos publicados por la administración.
            </p>
          )}
          {documentos.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-5 w-5 shrink-0 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{d.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.categoria} · {formatFecha(d.fecha)} · {formatPeso(d.pesoBytes)}
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
                  disabled={descargando === d.id}
                  aria-label={`Descargar ${d.nombre}`}
                  onClick={() => void descargar(d)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="certificados" className="mt-4 space-y-3">
          {tiposCertificado.map((t) => {
            const habilitado = puedePedirCertificado(rol, t.soloPropietarios);
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium">{t.nombre}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.descripcion}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Demora {t.demora}</p>
                  {!habilitado && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Solo lo puede pedir la persona propietaria de la unidad.
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={!habilitado || pidiendo}
                    onClick={() => void pedirCertificado(t.id, t.nombre)}
                  >
                    Pedir
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold">Tus pedidos</h2>
            {cargandoCerts && <p className="text-sm text-muted-foreground">Buscando pedidos…</p>}
            {!cargandoCerts && mias.length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no pediste ninguno.</p>
            )}
            <div className="space-y-2">
              {mias.map((c) => (
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
        </TabsContent>
      </Tabs>
      <PieDemo />
    </AppShell>
  );
}
