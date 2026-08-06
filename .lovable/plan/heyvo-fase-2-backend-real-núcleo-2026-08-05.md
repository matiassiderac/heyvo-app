# HEYVO — Fase 2: Backend real (núcleo)

Pasamos del prototipo con datos mockeados a una aplicación con base de datos,
acceso real y permisos por rol. En esta fase se migran a datos reales el padrón
(consorcios, torres, unidades, personas), las expensas y los reclamos. El resto
de los flujos (reservas, avisos, asambleas, documentos, mudanzas) sigue
funcionando con datos demo del frontend y se migra en una fase siguiente.

## Cómo entra la gente

- Email y contraseña, más "Iniciar sesión con Google".
- Pantalla `/auth` con ingreso y registro, mensajes en español rioplatense.
- La administración da de alta las unidades y las personas con su email. Cuando
  esa persona se registra con el mismo email, queda vinculada automáticamente a
  su unidad y a su consorcio.
- Si alguien se registra con un email que no está en el padrón, entra a una
  pantalla de "todavía no estás vinculado a una unidad" con el contacto de la
  administración. No ve datos de nadie.
- Cierre de sesión real, sesión persistente y recuperación de contraseña.

## Permisos

- Los roles viven en una tabla aparte (nunca en el perfil), con una función de
  verificación en el servidor. Nadie puede darse permisos a sí mismo.
- Residente / propietario / inquilino: ve solamente su unidad, sus expensas y
  sus reclamos.
- Administrador y operador: ven todo lo de los consorcios que administran.
- Superadmin HEYVO: ve el panel de plataforma, sin datos personales de residentes.
- El selector de perfil demo desaparece: el rol ahora surge de la base.

## Qué queda con datos reales en esta fase

- Padrón: consorcios, torres, unidades, personas y su vínculo con la unidad.
- Expensas: boletas por unidad y período, con estado pagada / pendiente /
  vencida, intereses y registro de pagos. El pago sigue siendo simulado
  (Mercado Pago real llega en Fase 3), pero el resultado se guarda de verdad.
- Reclamos: alta, categoría, prioridad, SLA, estados (nuevo, validando,
  asignado, en curso, esperando tercero, resuelto, cerrado, reabierto),
  historial de cambios, asignación a proveedor y CSAT al cerrar.
- Proveedores asociados a cada consorcio.

## El asistente

Sigue funcionando igual para el usuario, pero deja de leer datos inventados:
consulta expensas y reclamos reales del usuario que está logueado, y cuando
propone una acción (crear un reclamo, registrar un pago) esa acción se escribe
en la base con los permisos de esa persona. Las acciones siguen requiriendo
confirmación en pantalla.

## Datos iniciales

La base arranca cargada con los datos demo actuales (Administración Demo, dos
consorcios, torres, unidades, personas, boletas en los tres estados, reclamos
en todos los estados y proveedores), para poder recorrer la aplicación completa
desde el primer minuto. Se cargan como datos de ejemplo claramente rotulados y
se pueden borrar desde el panel más adelante.

Para probar cada rol vas a tener usuarios de ejemplo: al registrarte con uno de
los emails del padrón demo entrás directamente como esa persona.

## Orden de trabajo

1. Activar la base de datos y el sistema de cuentas; esquema del padrón, roles
   y permisos; carga de los datos de ejemplo.
2. Pantalla de acceso, registro, Google, recuperación de contraseña y vinculación
   por email. Rutas protegidas.
3. Migrar el portal del residente: inicio, expensas y reclamos contra datos reales.
4. Migrar el panel de administración: padrón, cobranzas, reclamos y proveedores.
5. Conectar el asistente a los datos reales.
6. Revisión de seguridad: que nadie pueda ver ni tocar datos de otra unidad o de
   otro consorcio.

## Detalles técnicos

- Lovable Cloud (Postgres + Auth) con RLS en todas las tablas y grants explícitos.
- `user_roles` con enum de roles y función `has_role` security definer; políticas
  que combinan `auth.uid()`, la unidad de la persona y el consorcio.
- Tabla `profiles` creada por trigger en el alta de usuario, con vinculación al
  padrón por email normalizado.
- Google vía el broker de Lovable (`lovable.auth.signInWithOAuth`) más
  `configure_social_auth`; auto-confirmación de email para que el registro
  funcione sin fricción en la etapa de prueba.
- Lecturas y escrituras a través de `createServerFn` con `requireSupabaseAuth`;
  rutas privadas bajo `_authenticated`, `/` y `/auth` públicas.
- Datos de ejemplo cargados en la propia migración (INSERT literales), no por
  código en tiempo de ejecución.
- Los fixtures de `src/data/demo.ts` quedan solo para los flujos aún no migrados.

## Fuera de esta fase

- Mercado Pago real, WhatsApp, email saliente, ERP, firma digital.
- Reservas, avisos, asambleas, documentos y mudanzas contra base de datos.
- Almacenamiento de archivos (comprobantes, documentos del consorcio).
