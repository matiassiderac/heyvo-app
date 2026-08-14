# HEYVO — Fase 1: Prototipo navegable

Aplicación SaaS multi-tenant para administradores de consorcios. Esta fase construye
la experiencia completa navegable con datos demo mockeados en el frontend: sin base de
datos, sin autenticación real y sin integraciones externas.

Fuentes de verdad leídas: el PDF de mapa de flujos (especificación funcional detallada),
el .docx (versión resumida, sin contradicciones con el PDF) y el manual de marca v1.0.

## Identidad visual (del manual de marca)

- Azul noche `#021730` como color estructural (~50% de la superficie), blanco ~33%,
  naranja `#FF6600` reservado a acentos y acciones (~12%), negro sólo para texto largo.
- Tipografía Poppins: SemiBold para títulos en caja baja, Medium para botones y
  etiquetas, Regular para cuerpo y mensajes del asistente.
- Isotipo (globo de diálogo con tres puntos) para avatar del asistente y favicon;
  logotipo completo en headers, mínimo 110 px de ancho.
- Tono de voz: segunda persona, presente, positivo. "Tu reclamo quedó registrado.
  Te aviso apenas haya novedades." Nunca lenguaje de expediente.

## Qué queda dentro y fuera

Dentro:
- Design system HEYVO en español de Argentina, ARS, zona horaria Buenos Aires, mobile-first.
- Tres portales navegables con datos demo coherentes.
- Los diez flujos del mapa, recorribles de punta a punta con datos demo.
- Estados explícitos: carga, vacío, error, sin permiso, integración no configurada, modo demo.
- Accesibilidad WCAG 2.2 AA: teclado, foco visible, contraste, labels.

Fuera (fases posteriores):
- Lovable Cloud, RLS, roles reales, OTP, storage.
- Mercado Pago sandbox real; en Fase 1 el pago es una pantalla demo con estados
  aprobado, pendiente y rechazado.
- WhatsApp, Meta, email, ERP, firma digital.

## Asistente con LLM real (dentro de Fase 1)

El asistente no usa guiones: entiende lenguaje libre, jerga argentina y variantes de
escritura mediante un modelo de lenguaje, sin listas de ejemplos cargadas a mano.

- Se ejecuta con Lovable AI (gateway integrado): no hace falta cuenta ni API key
  propia, y el costo se descuenta de los créditos del workspace.
- Modelo `openai/gpt-5.6-sol` vía la Responses API, con respuesta en streaming para que
  el residente vea la contestación mientras se genera.
- La clave y las instrucciones viven sólo en el servidor (ruta `/api/chat`); el
  navegador nunca ve el prompt ni credenciales.
- Prompt de sistema con la personalidad HEYVO: segunda persona, presente, positivo,
  español rioplatense, sin lenguaje de expediente. Se sostiene la misma voz del manual
  de marca en cada respuesta.
- El modelo recibe el contexto de la sesión demo (unidad, consorcio, rol, saldo,
  reclamos abiertos) y responde con esos datos.
- Herramientas (tool calling) sobre los datos demo, con aprobación explícita para lo
  que "cambia algo": consultar expensas, crear un reclamo, listar y reservar espacios
  comunes, consultar el estado de un ticket, buscar avisos y documentos, pedir un
  certificado. En Fase 1 escriben en el estado demo del navegador; en Fase 2 se apuntan
  a la base sin tocar la UI.
- Detección de casos críticos (gas, incendio, ascensor con personas, inundación, riesgo
  eléctrico) resuelta por el modelo: corta el flujo normal, muestra las instrucciones de
  emergencia y avisa que HEYVO no es un servicio de emergencias.
- Fuera de tema o fuera de permiso: el asistente lo dice con claridad y ofrece derivar
  a la administración, sin inventar datos que no tiene.
- Quick replies se mantienen como atajos sugeridos, no como el único camino.
- Manejo explícito de error en pantalla: límite de uso (429), créditos agotados (402) y
  fallas de red, con el texto del usuario preservado.
- Historial de conversación en memoria de sesión; sin persistencia en Fase 1.


## Orden de construcción

**Bloque A — Núcleo**
1. Design system + shell de navegación (residente móvil, admin con sidebar).
2. Acceso simulado (unidad + DNI/CUIT, OTP demo) y selector de perfil para recorrer roles.
3. Residente: inicio con resumen y alertas, asistente con el menú de diez rutas rápidas,
   expensas y boleta, pago demo, reclamos con ticket y SLA.
4. Admin: dashboard, inbox omnicanal, tickets con estados y handoff.

**Bloque B — Residente completo**
5. Reservas de espacios comunes con franjas y reglas, avisos y asambleas, documentos y
   certificados, mudanzas y accesos con constancia/QR, perfil con contactos autorizados
   y preferencias por canal.

**Bloque C — Administración completa**
6. Consorcios / torres / unidades / personas, expensas y conciliación, reservas,
   comunicaciones y asambleas, certificados y base de conocimiento, configuración
   (SLA, guardias, canales, integraciones), reportes y auditoría.

**Bloque D — Superadmin HEYVO**
7. Cuentas administradoras, uso por cuenta, salud de integraciones, estado de plan.
   Sin impersonación.

## Reglas de negocio que se reflejan en la UI

- SLA de reclamos: alta 2-4 h, media 24 h, baja 72 h; visibles y configurables.
- Estados de ticket: nuevo, validando, asignado, en curso, esperando tercero, resuelto,
  cerrado, reabierto. CSAT al cerrar.
- Casos críticos (gas, incendio, ascensor con personas, inundación, riesgo eléctrico):
  instrucciones de emergencia y alerta a guardia, con aviso de que HEYVO no es un
  servicio de emergencias.
- Una sola unidad visible por sesión.
- Un inquilino no puede pedir certificados reservados al propietario: la UI lo informa
  sin revelar datos indebidos.
- Sesión de 30 días, revalidación para operaciones sensibles.

## Datos demo

Fixtures tipados en TypeScript, rotulados como demo, sin datos personales reales:
- Administración Demo con dos consorcios, torres, unidades, residentes y proveedores.
- Boletas pagas, pendientes y vencidas; tickets en todos los estados y prioridades.
- Recursos comunes con reglas y reservas; avisos, una asamblea, documentos y las FAQs
  sugeridas en el mapa de flujos.
- Conversaciones web y eventos simulados de WhatsApp/email, marcados "modo demo".

## Roles

Los nueve roles se modelan como perfiles demo intercambiables desde un selector visible
sólo en el prototipo. La navegación y las acciones cambian según el rol, pero en Fase 1
esto es sólo presentación: la autorización real llega en Fase 2 con RLS y verificación
en servidor.

## Detalles técnicos

- TanStack Start + React 19 + TypeScript estricto, rutas en `src/routes`.
- Rutas: `/` acceso, `/app/*` portal residente, `/admin/*` portal operativo,
  `/plataforma/*` superadmin. Cada ruta con su propio `head()`.
- Tokens en `src/styles.css` en oklch derivados de #021730 y #FF6600. Sin clases de
  color hardcodeadas en componentes. Poppins cargada por `<link>` en el root route.
- shadcn/ui como base con variantes propias; sidebar de shadcn en admin.
- El chat se compone con AI Elements (conversation, message, prompt-input), con el
  isotipo HEYVO como avatar del asistente y renderizado de markdown.
- Asistente: ruta de servidor `/api/chat` en streaming con la Responses API del gateway
  de Lovable AI, modelo `openai/gpt-5.6-sol`; en el cliente `useChat` renderizando
  `message.parts`. Las herramientas se definen y ejecutan sólo en el servidor.
- Logotipo e isotipo se suben como assets CDN desde los archivos del manual; favicon
  generado a partir del isotipo.
- Datos demo en `src/data/*` con tipos que anticipan el ERD, para que Fase 2 los
  reemplace por consultas sin reescribir la UI.
- Sin secretos de terceros ni cobros reales: la única llamada de red saliente es la del
  asistente al gateway de Lovable AI, desde el servidor.

## Pendientes de tu lado

- Archivos vectoriales del isotipo y del logotipo si los tenés. El manual describe el
  isotipo (globo de diálogo con tres puntos) pero sólo llegó el logotipo en PNG; si no
  hay SVG, genero el isotipo siguiendo la descripción y lo reemplazás después.
- Credenciales de Mercado Pago sandbox: se usan recién en Fase 3. Cada consorcio
  conectará su propia cuenta (modelo "cuenta propia por consorcio").

## Decisiones confirmadas

- Prototipo sin backend: datos mockeados en el frontend, sin Lovable Cloud en esta fase.
- Selector de perfil demo para recorrer los nueve roles.
- Mercado Pago: cuenta propia por consorcio; en Fase 1 solo una pantalla demo de pago
  (aprobado, pendiente, rechazado). Conexión real y credenciales sandbox en Fase 3.
- Asistente con LLM real desde Fase 1 (Lovable AI, sin cuenta ni API key propia), no
  guiones. Se paga por mensaje con créditos del workspace.
- Paleta y tipografía exactamente como el manual de marca v1.0.
- Español de Argentina, ARS, America/Argentina/Buenos_Aires.

## Decisiones que necesito que apruebes

- Los tres portales completos, en el orden Núcleo → Residente → Admin → Superadmin.
