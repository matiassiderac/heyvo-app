import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, LogOut, ShieldCheck, Sparkles } from "lucide-react";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { roles } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";
import { usePrefsNotificacion, type PrefsNotificacion } from "@/lib/notificaciones";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const opcionesNotificacion: { id: keyof PrefsNotificacion; label: string }[] = [
  { id: "avisos", label: "Avisos del consorcio" },
  { id: "vencimientos", label: "Vencimiento de expensas" },
  { id: "reclamos", label: "Novedades de mis reclamos" },
  { id: "asambleas", label: "Convocatorias a asamblea" },
];

export const Route = createFileRoute("/_authenticated/app/perfil")({
  head: () => ({
    meta: [
      { title: "Tu perfil y unidad — HEYVO" },
      {
        name: "description",
        content:
          "Datos de tu unidad, preferencias de notificaciones y cambio de perfil demo entre los roles de HEYVO.",
      },
      { property: "og:title", content: "Tu perfil y unidad — HEYVO" },
      {
        property: "og:description",
        content: "Configurá cómo querés que te avisemos y con qué rol navegás el prototipo.",
      },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { rol, sesion, salir } = useDemo();
  const { prefs, cargando: cargandoPrefs, guardar, guardando } = usePrefsNotificacion();
  const navigate = useNavigate();
  const nombreRol = roles.find((r) => r.id === rol)?.nombre ?? "Residente";

  return (
    <AppShell titulo="Perfil" subtitulo="Tu unidad y tus preferencias.">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium">{sesion?.nombre}</p>
          <p className="text-xs text-muted-foreground">{sesion?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {nombreRol}
            {sesion?.unidadEtiqueta ? ` · Unidad ${sesion.unidadEtiqueta}` : ""}
            {sesion?.unidadM2 ? ` · ${sesion.unidadM2} m²` : ""}
            {sesion?.unidadCoeficiente ? ` · coeficiente ${sesion.unidadCoeficiente}%` : ""}
          </p>
          {sesion?.consorcioNombre && (
            <>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-accent" /> {sesion.consorcioNombre}
              </p>
              <p className="text-xs text-muted-foreground">{sesion.consorcioDireccion}</p>
            </>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-2 mt-5 text-sm font-semibold">Notificaciones</h2>
      <Card>
        <CardContent className="space-y-4 p-4">
          {cargandoPrefs && (
            <p className="text-sm text-muted-foreground">Buscando tus preferencias…</p>
          )}
          {opcionesNotificacion.map((n) => (
            <div key={n.id} className="flex items-center justify-between gap-3">
              <Label htmlFor={n.id} className="text-sm font-normal">
                {n.label}
              </Label>
              <Switch
                id={n.id}
                checked={prefs[n.id]}
                disabled={cargandoPrefs || guardando}
                onCheckedChange={(valor) => {
                  void guardar({ ...prefs, [n.id]: valor })
                    .then(() => toast.success("Preferencia guardada."))
                    .catch(() => toast.error("No pudimos guardar la preferencia."));
                }}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Guardamos tus preferencias en tu cuenta. Los envíos por email y WhatsApp todavía no
            están conectados en esta etapa.
          </p>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-2">
        {sesion?.esAdmin && (
          <Button asChild variant="outline">
            <Link to="/admin">
              <ShieldCheck className="mr-1 h-4 w-4" /> Ver portal de administración
            </Link>
          </Button>
        )}
        {rol === "superadmin" && (
          <Button asChild variant="outline">
            <Link to="/plataforma">
              <Sparkles className="mr-1 h-4 w-4" /> Ver panel HEYVO
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            void salir().then(() => navigate({ to: "/auth", replace: true }));
          }}
        >
          <LogOut className="mr-1 h-4 w-4" /> Cerrar sesión
        </Button>
      </div>

      <PieDemo />
    </AppShell>
  );
}
