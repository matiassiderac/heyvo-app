import { createFileRoute } from "@tanstack/react-router";
import { Phone, ShieldAlert } from "lucide-react";

import { AppShell, PieDemo } from "@/components/heyvo/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { contactos, faqs } from "@/data/demo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/contacto")({
  head: () => ({
    meta: [
      { title: "Emergencias y contactos — HEYVO" },
      {
        name: "description",
        content:
          "Teléfonos de emergencia del edificio, guardia de ascensores, encargado y preguntas frecuentes del consorcio.",
      },
      { property: "og:title", content: "Emergencias y contactos — HEYVO" },
      {
        property: "og:description",
        content: "Los números que necesitás cuando algo se complica.",
      },
    ],
  }),
  component: Contacto,
});

function Contacto() {
  const urgentes = contactos.filter((c) => c.urgente);
  const resto = contactos.filter((c) => !c.urgente);

  return (
    <AppShell titulo="Contacto" subtitulo="Emergencias y consultas frecuentes.">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="h-4 w-4" /> Si hay riesgo de vida, llamá primero
          </p>
          <div className="mt-3 space-y-2">
            {urgentes.map((c) => (
              <a
                key={c.telefono}
                href={`tel:${c.telefono}`}
                className="flex items-center justify-between rounded-xl bg-card p-3 text-sm"
              >
                <span>
                  <span className="block font-medium">{c.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{c.detalle}</span>
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-destructive">
                  <Phone className="h-4 w-4" /> {c.telefono}
                </span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-2 mt-5 text-sm font-semibold">Otros contactos</h2>
      <div className="space-y-2">
        {resto.map((c) => (
          <a key={c.telefono} href={`tel:${c.telefono}`} className="block">
            <Card>
              <CardContent className={cn("flex items-center justify-between gap-3 p-4")}>
                <span>
                  <span className="block text-sm font-medium">{c.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{c.detalle}</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm text-accent">
                  <Phone className="h-4 w-4" /> {c.telefono}
                </span>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <h2 className="mb-2 mt-5 text-sm font-semibold">Preguntas frecuentes</h2>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f) => (
          <AccordionItem
            key={f.pregunta}
            value={f.pregunta}
            className="rounded-xl border border-border bg-card px-4"
          >
            <AccordionTrigger className="text-left text-sm hover:no-underline">
              {f.pregunta}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {f.respuesta}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <PieDemo />
    </AppShell>
  );
}
