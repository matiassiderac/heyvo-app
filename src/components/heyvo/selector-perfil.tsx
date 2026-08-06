import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roles } from "@/data/demo";
import { useDemo } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

export function SelectorPerfil({
  variante = "oscuro",
}: {
  variante?: "oscuro" | "claro";
}) {
  const { sesion, rol, salir } = useDemo();
  const navigate = useNavigate();
  const actual = roles.find((r) => r.id === rol);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Tu cuenta"
        className={cn(
          "flex items-center gap-2 rounded-full px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          variante === "claro"
            ? "text-primary-foreground hover:bg-primary-foreground/10"
            : "text-foreground hover:bg-muted",
        )}
      >
        <UserCircle2 className="h-5 w-5" />
        <span className="hidden sm:inline">
          {sesion?.nombre?.split(" ")[0] ?? "Tu cuenta"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block text-sm font-medium">{sesion?.nombre}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {sesion?.email}
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            {actual?.nombre}
            {sesion?.unidadEtiqueta ? ` · Unidad ${sesion.unidadEtiqueta}` : ""}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/perfil">Tu perfil</Link>
        </DropdownMenuItem>
        {sesion?.esAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <ShieldCheck className="mr-2 h-4 w-4" /> Portal de administración
            </Link>
          </DropdownMenuItem>
        )}
        {rol === "superadmin" && (
          <DropdownMenuItem asChild>
            <Link to="/plataforma">
              <Sparkles className="mr-2 h-4 w-4" /> Panel HEYVO
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void salir().then(() => navigate({ to: "/auth", replace: true }));
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
