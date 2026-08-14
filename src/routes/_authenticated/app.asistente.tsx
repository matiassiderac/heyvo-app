import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/heyvo/app-shell";
import { AsistenteChat } from "@/components/heyvo/asistente-chat";

export const Route = createFileRoute("/_authenticated/app/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente virtual — HEYVO" },
      {
        name: "description",
        content:
          "Escribile al asistente de HEYVO con tus palabras: consulta expensas, abre reclamos, reserva espacios y pide documentación.",
      },
      { property: "og:title", content: "Asistente virtual — HEYVO" },
      {
        property: "og:description",
        content: "Un asistente con inteligencia artificial que entiende cómo hablás.",
      },
    ],
  }),
  component: () => (
    <AppShell
      titulo="Asistente"
      subtitulo="Contame qué necesitás. Entiendo texto libre."
    >
      <AsistenteChat />
    </AppShell>
  ),
});
