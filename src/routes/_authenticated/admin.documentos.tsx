import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, Lock, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/heyvo/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatFecha } from "@/data/demo";
import { useCertificados } from "@/lib/certificados";
import {
  categoriasDocumento,
  esquemaDocumento,
  formatPeso,
  urlDescargaDocumento,
  useDocumentos,
  useEliminarDocumento,
  useSubirDocumento,
  type CategoriaDocumento,
  type DocumentoApp,
} from "@/lib/documentos";

export const Route = createFileRoute("/_authenticated/admin/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos y certificados — Administración HEYVO" },
      {
        name: "description",
        content:
          "Publicá el reglamento, balances, actas y pólizas del consorcio y resolvé los pedidos de certificados de los vecinos.",
      },
      { property: "og:title", content: "Documentos del consorcio — HEYVO" },
      {
        property: "og:description",
        content: "Biblioteca del edificio y pedidos de certificados en un solo lugar.",
      },
    ],
  }),
  component: AdminDocumentos,
});

function AdminDocumentos() {
  const { documentos, cargando } = useDocumentos();
  const subir = useSubirDocumento();
  const eliminar = useEliminarDocumento();
  const {
    solicitudes,
    cargando: cargandoCerts,
    cambiarEstado,
    cambiandoEstado,
  } = useCertificados();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDocumento>("Reglamento");
  const [soloPropietarios, setSoloPropietarios] = useState(false);

  const publicar = async () => {
    if (!archivo) {
      toast.error("Elegí un archivo para subir.");
      return;
    }
    const validacion = esquemaDocumento.safeParse({ nombre, categoria, soloPropietarios });
    if (!validacion.success) {
      toast.error(validacion.error.issues[0]?.message ?? "Revisá los datos del documento.");
      return;
    }
    try {
      await subir.mutateAsync({ archivo, datos: validacion.data });
      setArchivo(null);
      setNombre("");
      setSoloPropietarios(false);
      toast.success("Documento publicado para el consorcio.");
    } catch {
      toast.error("No pudimos subir el documento.");
    }
  };

  const descargar = async (d: DocumentoApp) => {
    try {
      const url = await urlDescargaDocumento(d.storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("No pudimos abrir el archivo.");
    }
  };

  return (
    <AdminShell titulo="Documentos" subtitulo="Biblioteca del edificio y pedidos de certificados.">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">Archivos del consorcio</p>
              {cargando && <p className="text-sm text-muted-foreground">Buscando archivos…</p>}
              {!cargando && documentos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todavía no subiste ningún documento.
                </p>
              )}
              <div className="space-y-2">
                {documentos.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3"
                  >
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
                      aria-label={`Descargar ${d.nombre}`}
                      onClick={() => void descargar(d)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${d.nombre}`}
                      disabled={eliminar.isPending}
                      onClick={() => {
                        void eliminar
                          .mutateAsync(d)
                          .then(() => toast.success("Documento eliminado."))
                          .catch(() => toast.error("No pudimos eliminarlo."));
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">Pedidos de certificados</p>
              {cargandoCerts && <p className="text-sm text-muted-foreground">Buscando pedidos…</p>}
              {!cargandoCerts && solicitudes.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay pedidos pendientes.</p>
              )}
              <div className="space-y-2">
                {solicitudes.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{s.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.unidad ? `Unidad ${s.unidad} · ` : ""}
                        {formatFecha(s.fecha)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.estado === "listo" ? "default" : "secondary"}>
                        {s.estado === "listo" ? "Listo" : "En proceso"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cambiandoEstado}
                        onClick={() => {
                          void cambiarEstado({
                            id: s.id,
                            estado: s.estado === "listo" ? "en_proceso" : "listo",
                          })
                            .then(() => toast.success("Pedido actualizado."))
                            .catch(() => toast.error("No pudimos actualizarlo."));
                        }}
                      >
                        {s.estado === "listo" ? "Reabrir" : "Marcar listo"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Subir documento</p>
            <div className="space-y-1.5">
              <Label htmlFor="archivo">Archivo</Label>
              <Input
                id="archivo"
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setArchivo(f);
                  if (f && !nombre) setNombre(f.name.replace(/\.[^.]+$/, ""));
                }}
              />
              <p className="text-xs text-muted-foreground">Hasta 15 MB por archivo.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre visible</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Balance de julio 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as CategoriaDocumento)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDocumento.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="solo-prop" className="text-sm font-normal">
                Visible solo para propietarios
              </Label>
              <Switch
                id="solo-prop"
                checked={soloPropietarios}
                onCheckedChange={setSoloPropietarios}
              />
            </div>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={subir.isPending}
              onClick={() => void publicar()}
            >
              <Upload className="mr-1 h-4 w-4" /> Publicar documento
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
