import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, FileText, Lock, Upload } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, formatFecha } from "@/data/demo";
import { useDemo, type DocumentoApp } from "@/lib/demo-session";

export const Route = createFileRoute("/_authenticated/admin/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos y certificados — HEYVO" },
      {
        name: "description",
        content: "Subí el reglamento, balances y actas, y despachá los certificados pedidos.",
      },
      { property: "og:title", content: "Documentos y certificados — HEYVO" },
      {
        property: "og:description",
        content: "Los archivos que ven tus residentes y sus pedidos de certificados.",
      },
    ],
  }),
  component: AdminDocumentos,
});

const categorias: DocumentoApp["categoria"][] = [
  "Reglamento",
  "Balance",
  "Acta",
  "Seguro",
  "Contrato",
];

function AdminDocumentos() {
  const {
    documentos,
    cargandoDocumentos,
    subirDocumento,
    descargarDocumento,
    certificados,
    cargandoCertificados,
    marcarCertificadoListo,
  } = useDemo();

  const inputRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<DocumentoApp["categoria"]>("Reglamento");
  const [soloPropietarios, setSoloPropietarios] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const subir = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Elegí un archivo para subir.");
      return;
    }
    if (!nombre.trim()) {
      toast.error("Ponele un nombre al documento.");
      return;
    }
    setSubiendo(true);
    void subirDocumento({ file, nombre: nombre.trim(), categoria, soloPropietarios })
      .then(() => {
        toast.success("Documento subido.");
        setNombre("");
        setSoloPropietarios(false);
        if (inputRef.current) inputRef.current.value = "";
      })
      .catch(() => toast.error("No pudimos subir el documento."))
      .finally(() => setSubiendo(false));
  };

  const descargar = (d: DocumentoApp) => {
    void descargarDocumento(d)
      .then((url) => window.open(url, "_blank", "noopener,noreferrer"))
      .catch(() => toast.error("No pudimos generar el enlace de descarga."));
  };

  const marcarListo = (id: string) => {
    void marcarCertificadoListo(id)
      .then(() => toast.success("Certificado marcado como listo."))
      .catch(() => toast.error("No pudimos actualizar el certificado."));
  };

  return (
    <AdminShell titulo="Documentos" subtitulo="Archivos del consorcio y certificados pedidos.">
      <Tabs defaultValue="archivos">
        <TabsList className="w-full">
          <TabsTrigger value="archivos" className="flex-1">
            Archivos
          </TabsTrigger>
          <TabsTrigger value="certificados" className="flex-1">
            Certificados ({certificados.filter((c) => c.estado === "en_proceso").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="archivos" className="mt-4 space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-nombre">Nombre</Label>
                <Input
                  id="doc-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Reglamento de copropiedad"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select
                    value={categoria}
                    onValueChange={(v) => setCategoria(v as DocumentoApp["categoria"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doc-archivo">Archivo</Label>
                  <Input id="doc-archivo" ref={inputRef} type="file" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="doc-propietarios"
                  checked={soloPropietarios}
                  onCheckedChange={(v) => setSoloPropietarios(v === true)}
                />
                <Label htmlFor="doc-propietarios" className="text-sm font-normal">
                  Solo para propietarios
                </Label>
              </div>
              <Button
                onClick={subir}
                disabled={subiendo}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Upload className="mr-1 h-4 w-4" /> Subir documento
              </Button>
            </CardContent>
          </Card>

          {cargandoDocumentos ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando documentos…</p>
          ) : (
            <div className="space-y-2">
              {documentos.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Todavía no subiste ningún documento.
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificados" className="mt-4">
          {cargandoCertificados ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Cargando pedidos…</p>
          ) : (
            <div className="space-y-2">
              {certificados.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    No hay certificados pedidos.
                  </CardContent>
                </Card>
              )}
              {certificados.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-sm font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatFecha(c.fecha)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.estado === "listo" ? "default" : "secondary"}>
                        {c.estado === "listo" ? "Listo" : "En proceso"}
                      </Badge>
                      {c.estado !== "listo" && (
                        <Button size="sm" variant="ghost" onClick={() => marcarListo(c.id)}>
                          Marcar listo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
