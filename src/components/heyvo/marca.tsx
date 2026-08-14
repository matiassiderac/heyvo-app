import isotipo from "@/assets/heyvo-isotipo.png";
import { cn } from "@/lib/utils";

export function Isotipo({ className }: { className?: string }) {
  return (
    <img
      src={isotipo}
      alt="Isotipo de HEYVO"
      width={512}
      height={512}
      loading="lazy"
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}

export function Logotipo({
  className,
  variante = "oscuro",
}: {
  className?: string;
  variante?: "oscuro" | "claro";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0 text-2xl font-semibold lowercase tracking-tight",
        className,
      )}
    >
      <span className={variante === "claro" ? "text-primary-foreground" : "text-primary"}>
        hey
      </span>
      <span className="text-accent">vo</span>
    </span>
  );
}

export function MarcaHeyvo({
  className,
  variante = "oscuro",
}: {
  className?: string;
  variante?: "oscuro" | "claro";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Isotipo className="h-7 w-7" />
      <Logotipo variante={variante} className="text-xl" />
    </span>
  );
}

export function BadgeDemo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-medium text-accent",
        className,
      )}
    >
      modo demo
    </span>
  );
}
