import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Receipt,
  Users,
  Wrench,
} from "lucide-react";

import { Isotipo, Logotipo, BadgeDemo } from "@/components/heyvo/marca";
import { SelectorPerfil } from "@/components/heyvo/selector-perfil";
import { cn } from "@/lib/utils";

type Item = {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  icon: typeof Users;
  exact?: boolean;
};

const items: Item[] = [
  { to: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { to: "/admin/reclamos", label: "Reclamos", icon: Wrench },
  { to: "/admin/expensas", label: "Cobranzas", icon: Receipt },
  { to: "/admin/avisos", label: "Avisos", icon: Megaphone },
  { to: "/admin/documentos", label: "Documentos", icon: FileText },
  { to: "/admin/conversaciones", label: "Conversaciones", icon: MessagesSquare },
  { to: "/admin/proveedores", label: "Proveedores", icon: Building2 },
  { to: "/admin/personas", label: "Padrón", icon: Users },
];

export function AdminShell({
  titulo,
  subtitulo,
  accion,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <Isotipo className="h-8 w-8" />
            <Logotipo variante="claro" className="text-xl" />
          </Link>
          <span className="hidden text-xs text-primary-foreground/60 sm:inline">
            Administración
          </span>
          <div className="ml-auto flex items-center gap-2">
            <BadgeDemo />
            <SelectorPerfil variante="claro" />
          </div>
        </div>
        <nav className="mx-auto max-w-7xl overflow-x-auto px-2">
          <ul className="flex gap-1 pb-2">
            {items.map((item) => {
              const Icon = item.icon;
              const activo = item.exact
                ? pathname === item.to
                : pathname.startsWith(String(item.to));
              return (
                <li key={String(item.to)}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                      activo
                        ? "bg-accent text-accent-foreground"
                        : "text-primary-foreground/75 hover:bg-primary-foreground/10",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{titulo}</h1>
            {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
          </div>
          {accion}
        </div>
        {children}
      </main>
    </div>
  );
}
