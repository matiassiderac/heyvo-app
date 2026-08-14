import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import {
  Bell,
  CalendarCheck,
  FileText,
  Home,
  MessageCircle,
  Receipt,
  User,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import { BadgeDemo, MarcaHeyvo } from "@/components/heyvo/marca";
import { SelectorPerfil } from "@/components/heyvo/selector-perfil";
import { cn } from "@/lib/utils";
import { useDemo } from "@/lib/demo-session";

type NavItem = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  destacado?: boolean;
};

const nav: NavItem[] = [
  { to: "/app", label: "Inicio", icon: Home, exact: true },
  { to: "/app/expensas", label: "Expensas", icon: Receipt },
  { to: "/app/asistente", label: "Asistente", icon: MessageCircle, destacado: true },
  { to: "/app/reclamos", label: "Reclamos", icon: Wrench },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

export const accesosSecundarios = [
  { to: "/app/reservas", label: "Reservas", icon: CalendarCheck },
  { to: "/app/avisos", label: "Avisos", icon: Bell },
  { to: "/app/documentos", label: "Documentos", icon: FileText },
] as const;

export function AppShell({
  children,
  titulo,
  subtitulo,
  accion,
}: {
  children: ReactNode;
  titulo?: string;
  subtitulo?: string;
  accion?: ReactNode;
}) {
  const { avisos, sesion } = useDemo();
  const sinLeer = avisos.filter((a) => !a.leido).length;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col bg-background shadow-sm">
      <header className="sticky top-0 z-20 bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <div className="flex items-center justify-between">
          <MarcaHeyvo variante="claro" />
          <div className="flex items-center gap-1">
            <Link
              to="/app/avisos"
              aria-label={`Avisos${sinLeer ? `, ${sinLeer} sin leer` : ""}`}
              className="relative rounded-full p-2 transition-colors hover:bg-primary-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Bell className="h-5 w-5" />
              {sinLeer > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
              )}
            </Link>
            <SelectorPerfil variante="claro" />
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-primary-foreground/70">
              {sesion?.consorcioNombre ?? "Tu consorcio"}
              {sesion?.unidadEtiqueta ? ` · Unidad ${sesion.unidadEtiqueta}` : ""}
            </p>
            {titulo && <h1 className="mt-0.5 text-xl font-semibold">{titulo}</h1>}
            {subtitulo && (
              <p className="mt-1 text-sm text-primary-foreground/75">{subtitulo}</p>
            )}
          </div>
          {accion}
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 z-30 w-full max-w-[520px] border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex items-stretch justify-between">
          {nav.map((item) => {
            const activo = item.exact
              ? pathname === item.to
              : pathname.startsWith(String(item.to));
            const Icon = item.icon;
            return (
              <li key={String(item.to)} className="flex-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    activo ? "text-accent" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                      item.destacado
                        ? "bg-accent text-accent-foreground"
                        : activo
                          ? "bg-accent/12"
                          : "",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PieDemo({ texto = "Datos ficticios de prueba" }: { texto?: string }) {
  return (
    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
      <BadgeDemo /> {texto}
    </p>
  );
}
