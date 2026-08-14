/**
 * Datos demo de HEYVO — Fase 1 (prototipo navegable).
 * Todo es ficticio y está rotulado como demo. Los tipos anticipan el ERD de Fase 2
 * para que la UI no se reescriba cuando lleguen las consultas reales.
 */

export type RolId =
  | "residente"
  | "propietario"
  | "inquilino"
  | "encargado"
  | "administrador"
  | "operador"
  | "contable"
  | "proveedor"
  | "superadmin";

export type Rol = {
  id: RolId;
  nombre: string;
  descripcion: string;
  portal: "residente" | "admin" | "plataforma";
};

export const roles: Rol[] = [
  {
    id: "propietario",
    nombre: "Propietario",
    descripcion: "Dueño de la unidad. Ve expensas, certificados y asambleas.",
    portal: "residente",
  },
  {
    id: "inquilino",
    nombre: "Inquilino",
    descripcion: "Habita la unidad. No accede a certificados de titularidad.",
    portal: "residente",
  },
  {
    id: "residente",
    nombre: "Residente autorizado",
    descripcion: "Convive en la unidad con permisos acotados.",
    portal: "residente",
  },
  {
    id: "encargado",
    nombre: "Encargado",
    descripcion: "Personal del edificio. Gestiona accesos y reclamos en el lugar.",
    portal: "admin",
  },
  {
    id: "operador",
    nombre: "Operador de mesa",
    descripcion: "Atiende el inbox omnicanal y los tickets del día.",
    portal: "admin",
  },
  {
    id: "administrador",
    nombre: "Administrador",
    descripcion: "Responsable del consorcio. Acceso completo a la operación.",
    portal: "admin",
  },
  {
    id: "contable",
    nombre: "Contable",
    descripcion: "Expensas, conciliación y reportes económicos.",
    portal: "admin",
  },
  {
    id: "proveedor",
    nombre: "Proveedor",
    descripcion: "Recibe órdenes de trabajo asignadas.",
    portal: "admin",
  },
  {
    id: "superadmin",
    nombre: "Superadmin HEYVO",
    descripcion: "Equipo HEYVO. Cuentas, uso y salud de integraciones.",
    portal: "plataforma",
  },
];

export type Consorcio = {
  id: string;
  nombre: string;
  direccion: string;
  torres: { id: string; nombre: string; unidades: number }[];
  unidades: number;
  residentes: number;
  moraPorcentaje: number;
};

export const consorcios: Consorcio[] = [
  {
    id: "cons-01",
    nombre: "Edificio Rivadavia 2450",
    direccion: "Av. Rivadavia 2450, CABA",
    torres: [{ id: "t-01", nombre: "Torre única", unidades: 48 }],
    unidades: 48,
    residentes: 96,
    moraPorcentaje: 12,
  },
  {
    id: "cons-02",
    nombre: "Complejo Palermo Verde",
    direccion: "Gorriti 5120, CABA",
    torres: [
      { id: "t-02", nombre: "Torre Norte", unidades: 60 },
      { id: "t-03", nombre: "Torre Sur", unidades: 54 },
    ],
    unidades: 114,
    residentes: 231,
    moraPorcentaje: 8,
  },
];

export type Unidad = {
  id: string;
  consorcioId: string;
  torreId: string;
  etiqueta: string;
  piso: string;
  depto: string;
  m2: number;
  coeficiente: number;
};

export const unidadDemo: Unidad = {
  id: "u-4b",
  consorcioId: "cons-01",
  torreId: "t-01",
  etiqueta: "4° B",
  piso: "4",
  depto: "B",
  m2: 72,
  coeficiente: 2.1,
};

export type EstadoBoleta = "paga" | "pendiente" | "vencida";

export type Boleta = {
  id: string;
  periodo: string;
  vencimiento: string;
  total: number;
  estado: EstadoBoleta;
  detalle: { concepto: string; monto: number }[];
  interes?: number;
};

export const boletas: Boleta[] = [
  {
    id: "exp-2026-07",
    periodo: "Julio 2026",
    vencimiento: "2026-08-10",
    total: 168400,
    estado: "pendiente",
    detalle: [
      { concepto: "Gastos ordinarios", monto: 121500 },
      { concepto: "Sueldos y cargas", monto: 32400 },
      { concepto: "Fondo de reserva", monto: 9800 },
      { concepto: "Servicios comunes", monto: 4700 },
    ],
  },
  {
    id: "exp-2026-06",
    periodo: "Junio 2026",
    vencimiento: "2026-07-10",
    total: 154900,
    estado: "vencida",
    interes: 6196,
    detalle: [
      { concepto: "Gastos ordinarios", monto: 112300 },
      { concepto: "Sueldos y cargas", monto: 30100 },
      { concepto: "Fondo de reserva", monto: 8900 },
      { concepto: "Servicios comunes", monto: 3600 },
    ],
  },
  {
    id: "exp-2026-05",
    periodo: "Mayo 2026",
    vencimiento: "2026-06-10",
    total: 149200,
    estado: "paga",
    detalle: [
      { concepto: "Gastos ordinarios", monto: 108000 },
      { concepto: "Sueldos y cargas", monto: 29500 },
      { concepto: "Fondo de reserva", monto: 8400 },
      { concepto: "Servicios comunes", monto: 3300 },
    ],
  },
  {
    id: "exp-2026-04",
    periodo: "Abril 2026",
    vencimiento: "2026-05-10",
    total: 141800,
    estado: "paga",
    detalle: [
      { concepto: "Gastos ordinarios", monto: 103200 },
      { concepto: "Sueldos y cargas", monto: 27600 },
      { concepto: "Fondo de reserva", monto: 8000 },
      { concepto: "Servicios comunes", monto: 3000 },
    ],
  },
];

export type PrioridadTicket = "alta" | "media" | "baja";

export type EstadoTicket =
  | "nuevo"
  | "validando"
  | "asignado"
  | "en_curso"
  | "esperando_tercero"
  | "resuelto"
  | "cerrado"
  | "reabierto";

export const etiquetasEstadoTicket: Record<EstadoTicket, string> = {
  nuevo: "Nuevo",
  validando: "Validando",
  asignado: "Asignado",
  en_curso: "En curso",
  esperando_tercero: "Esperando a un tercero",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  reabierto: "Reabierto",
};

export const slaHoras: Record<PrioridadTicket, number> = {
  alta: 4,
  media: 24,
  baja: 72,
};

export type Ticket = {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  unidad: string;
  consorcioId: string;
  creado: string;
  vence: string;
  canal: "app" | "whatsapp" | "email" | "telefono";
  asignadoA?: string;
  historial: { fecha: string; texto: string }[];
  csat?: number;
};

export const tickets: Ticket[] = [
  {
    id: "TK-1042",
    titulo: "Pérdida de agua en el palier del 4°",
    categoria: "Plomería",
    descripcion:
      "Hay agua acumulada frente al ascensor del cuarto piso desde esta mañana.",
    prioridad: "alta",
    estado: "en_curso",
    unidad: "4° B",
    consorcioId: "cons-01",
    creado: "2026-08-04T09:12:00-03:00",
    vence: "2026-08-04T13:12:00-03:00",
    canal: "app",
    asignadoA: "Plomería del Centro",
    historial: [
      { fecha: "2026-08-04T09:12", texto: "Creaste el reclamo desde el asistente." },
      { fecha: "2026-08-04T09:40", texto: "El encargado confirmó la pérdida." },
      { fecha: "2026-08-04T10:15", texto: "Se asignó a Plomería del Centro." },
    ],
  },
  {
    id: "TK-1039",
    titulo: "La luz del pasillo del 2° parpadea",
    categoria: "Electricidad",
    descripcion: "El tubo del pasillo prende y apaga solo.",
    prioridad: "media",
    estado: "asignado",
    unidad: "2° A",
    consorcioId: "cons-01",
    creado: "2026-08-03T18:02:00-03:00",
    vence: "2026-08-04T18:02:00-03:00",
    canal: "whatsapp",
    asignadoA: "Electricidad Sur",
    historial: [
      { fecha: "2026-08-03T18:02", texto: "Ingresó por WhatsApp (modo demo)." },
      { fecha: "2026-08-03T19:20", texto: "Se asignó a Electricidad Sur." },
    ],
  },
  {
    id: "TK-1031",
    titulo: "Ruidos molestos los fines de semana",
    categoria: "Convivencia",
    descripcion: "Música fuerte después de las 2 de la mañana en el 6° C.",
    prioridad: "baja",
    estado: "esperando_tercero",
    unidad: "5° C",
    consorcioId: "cons-01",
    creado: "2026-07-30T11:00:00-03:00",
    vence: "2026-08-02T11:00:00-03:00",
    canal: "email",
    historial: [
      { fecha: "2026-07-30T11:00", texto: "Ingresó por email (modo demo)." },
      { fecha: "2026-07-31T09:00", texto: "Se envió nota al propietario del 6° C." },
    ],
  },
  {
    id: "TK-1025",
    titulo: "Ascensor detenido entre pisos",
    categoria: "Ascensores",
    descripcion: "El ascensor quedó trabado, sin personas adentro.",
    prioridad: "alta",
    estado: "resuelto",
    unidad: "Común",
    consorcioId: "cons-02",
    creado: "2026-07-28T08:15:00-03:00",
    vence: "2026-07-28T12:15:00-03:00",
    canal: "telefono",
    asignadoA: "Ascensores Delta",
    historial: [
      { fecha: "2026-07-28T08:15", texto: "Ingresó por teléfono." },
      { fecha: "2026-07-28T10:40", texto: "Ascensores Delta normalizó el servicio." },
    ],
    csat: 5,
  },
  {
    id: "TK-1018",
    titulo: "Filtración en cochera",
    categoria: "Humedad",
    descripcion: "Mancha de humedad sobre la cochera 12.",
    prioridad: "media",
    estado: "cerrado",
    unidad: "Cochera 12",
    consorcioId: "cons-02",
    creado: "2026-07-20T15:30:00-03:00",
    vence: "2026-07-21T15:30:00-03:00",
    canal: "app",
    asignadoA: "Impermeabilizaciones RB",
    historial: [
      { fecha: "2026-07-20T15:30", texto: "Creado desde la app." },
      { fecha: "2026-07-23T12:00", texto: "Trabajo terminado y cerrado." },
    ],
    csat: 4,
  },
  {
    id: "TK-1044",
    titulo: "Portón de acceso no responde al control",
    categoria: "Accesos",
    descripcion: "El control remoto dejó de abrir el portón vehicular.",
    prioridad: "media",
    estado: "nuevo",
    unidad: "Común",
    consorcioId: "cons-02",
    creado: "2026-08-05T07:45:00-03:00",
    vence: "2026-08-06T07:45:00-03:00",
    canal: "app",
    historial: [{ fecha: "2026-08-05T07:45", texto: "Reclamo recibido." }],
  },
];

export const categoriasReclamo = [
  "Plomería",
  "Electricidad",
  "Ascensores",
  "Humedad",
  "Limpieza",
  "Convivencia",
  "Accesos",
  "Otros",
];

export type Amenity = {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  reglas: string[];
  franjas: string[];
  requiereDeposito?: number;
};

export const amenities: Amenity[] = [
  {
    id: "sum",
    nombre: "SUM",
    descripcion: "Salón de usos múltiples con cocina y parrilla interior.",
    capacidad: 40,
    reglas: [
      "Reserva con hasta 30 días de anticipación.",
      "Se libera a las 2 de la mañana.",
      "Depósito reintegrable de $60.000.",
      "No se puede reservar con expensas vencidas.",
    ],
    franjas: ["12:00 a 17:00", "18:00 a 23:00"],
    requiereDeposito: 60000,
  },
  {
    id: "parrilla",
    nombre: "Parrilla de terraza",
    descripcion: "Parrilla al aire libre con mesa para 10 personas.",
    capacidad: 10,
    reglas: ["Una reserva por unidad por semana.", "Dejar limpio al retirarse."],
    franjas: ["12:00 a 16:00", "20:00 a 00:00"],
  },
  {
    id: "coworking",
    nombre: "Sala de coworking",
    descripcion: "Seis puestos con wifi y sala de reuniones chica.",
    capacidad: 6,
    reglas: ["Hasta 4 horas por día.", "Sin llamadas en el sector abierto."],
    franjas: ["08:00 a 12:00", "13:00 a 17:00", "18:00 a 21:00"],
  },
  {
    id: "laundry",
    nombre: "Laundry",
    descripcion: "Dos lavarropas y una secadora.",
    capacidad: 2,
    reglas: ["Turnos de 2 horas.", "Retirar la ropa al finalizar."],
    franjas: ["09:00 a 11:00", "11:00 a 13:00", "17:00 a 19:00"],
  },
];

export type Reserva = {
  id: string;
  amenityId: string;
  fecha: string;
  franja: string;
  unidad: string;
  estado: "confirmada" | "pendiente" | "cancelada";
};

export const reservas: Reserva[] = [
  {
    id: "RS-501",
    amenityId: "sum",
    fecha: "2026-08-16",
    franja: "18:00 a 23:00",
    unidad: "4° B",
    estado: "confirmada",
  },
  {
    id: "RS-498",
    amenityId: "coworking",
    fecha: "2026-08-07",
    franja: "08:00 a 12:00",
    unidad: "4° B",
    estado: "confirmada",
  },
  {
    id: "RS-489",
    amenityId: "parrilla",
    fecha: "2026-07-26",
    franja: "20:00 a 00:00",
    unidad: "2° A",
    estado: "cancelada",
  },
];

export type Aviso = {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: string;
  tipo: "informativo" | "urgente" | "mantenimiento";
  leido: boolean;
};

export const avisos: Aviso[] = [
  {
    id: "AV-88",
    titulo: "Corte de agua programado",
    cuerpo:
      "El jueves 8 de agosto de 9 a 13 se corta el agua por reparación de la bomba. Te recomendamos juntar agua la noche anterior.",
    fecha: "2026-08-04",
    tipo: "mantenimiento",
    leido: false,
  },
  {
    id: "AV-87",
    titulo: "Nueva empresa de limpieza",
    cuerpo:
      "Desde el 1 de agosto la limpieza de espacios comunes queda a cargo de Servicios Norte. Los días y horarios no cambian.",
    fecha: "2026-08-01",
    tipo: "informativo",
    leido: true,
  },
  {
    id: "AV-85",
    titulo: "Recordatorio: bolsas de residuos",
    cuerpo:
      "Dejá las bolsas en el contenedor del subsuelo después de las 20. Ayuda a que el palier se mantenga limpio.",
    fecha: "2026-07-28",
    tipo: "informativo",
    leido: true,
  },
];

export type Asamblea = {
  id: string;
  titulo: string;
  fecha: string;
  modalidad: "presencial" | "virtual" | "mixta";
  estado: "convocada" | "en_curso" | "cerrada";
  temario: string[];
  votaciones: {
    id: string;
    tema: string;
    opciones: string[];
    votoEmitido?: string;
    resultado?: Record<string, number>;
  }[];
};

export const asambleas: Asamblea[] = [
  {
    id: "AS-12",
    titulo: "Asamblea ordinaria de agosto",
    fecha: "2026-08-20T19:00:00-03:00",
    modalidad: "mixta",
    estado: "convocada",
    temario: [
      "Aprobación del balance de julio.",
      "Presupuesto para impermeabilizar la terraza.",
      "Reemplazo de luminarias por LED.",
    ],
    votaciones: [
      {
        id: "VT-1",
        tema: "Impermeabilización de terraza: tres presupuestos",
        opciones: ["Presupuesto A", "Presupuesto B", "Presupuesto C", "Abstención"],
      },
      {
        id: "VT-2",
        tema: "Cambio de luminarias a LED",
        opciones: ["A favor", "En contra", "Abstención"],
      },
    ],
  },
  {
    id: "AS-11",
    titulo: "Asamblea extraordinaria de mayo",
    fecha: "2026-05-14T19:00:00-03:00",
    modalidad: "virtual",
    estado: "cerrada",
    temario: ["Contratación de seguridad nocturna."],
    votaciones: [
      {
        id: "VT-0",
        tema: "Contratación de seguridad nocturna",
        opciones: ["A favor", "En contra", "Abstención"],
        votoEmitido: "A favor",
        resultado: { "A favor": 31, "En contra": 9, Abstención: 4 },
      },
    ],
  },
];

export type Documento = {
  id: string;
  nombre: string;
  categoria: "Reglamento" | "Balance" | "Acta" | "Seguro" | "Contrato";
  fecha: string;
  peso: string;
  soloPropietarios?: boolean;
};

export const documentos: Documento[] = [
  {
    id: "DOC-1",
    nombre: "Reglamento de copropiedad",
    categoria: "Reglamento",
    fecha: "2019-03-12",
    peso: "1,8 MB",
  },
  {
    id: "DOC-2",
    nombre: "Reglamento interno de espacios comunes",
    categoria: "Reglamento",
    fecha: "2025-11-02",
    peso: "420 KB",
  },
  {
    id: "DOC-3",
    nombre: "Balance julio 2026",
    categoria: "Balance",
    fecha: "2026-08-02",
    peso: "980 KB",
    soloPropietarios: true,
  },
  {
    id: "DOC-4",
    nombre: "Acta asamblea mayo 2026",
    categoria: "Acta",
    fecha: "2026-05-16",
    peso: "310 KB",
  },
  {
    id: "DOC-5",
    nombre: "Póliza integral del edificio",
    categoria: "Seguro",
    fecha: "2026-01-10",
    peso: "1,2 MB",
  },
];

export type TipoCertificado = {
  id: string;
  nombre: string;
  descripcion: string;
  soloPropietarios: boolean;
  demora: string;
};

export const tiposCertificado: TipoCertificado[] = [
  {
    id: "libre-deuda",
    nombre: "Certificado de libre deuda",
    descripcion: "Acredita que la unidad no registra deuda de expensas.",
    soloPropietarios: true,
    demora: "48 horas hábiles",
  },
  {
    id: "residencia",
    nombre: "Constancia de residencia",
    descripcion: "Acredita que vivís en la unidad.",
    soloPropietarios: false,
    demora: "24 horas hábiles",
  },
  {
    id: "expensas",
    nombre: "Detalle de expensas pagadas",
    descripcion: "Resumen de los pagos del último año.",
    soloPropietarios: false,
    demora: "24 horas hábiles",
  },
];

export type Mudanza = {
  id: string;
  tipo: "mudanza" | "flete" | "obra";
  fecha: string;
  franja: string;
  unidad: string;
  estado: "solicitada" | "aprobada" | "rechazada";
  codigo?: string;
};

export const mudanzas: Mudanza[] = [
  {
    id: "MU-32",
    tipo: "flete",
    fecha: "2026-08-12",
    franja: "09:00 a 12:00",
    unidad: "4° B",
    estado: "aprobada",
    codigo: "HEYVO-MU32-4B",
  },
  {
    id: "MU-28",
    tipo: "obra",
    fecha: "2026-07-14",
    franja: "10:00 a 17:00",
    unidad: "7° D",
    estado: "aprobada",
    codigo: "HEYVO-MU28-7D",
  },
];

export type ContactoEmergencia = {
  nombre: string;
  detalle: string;
  telefono: string;
  urgente?: boolean;
};

export const contactos: ContactoEmergencia[] = [
  { nombre: "Bomberos", detalle: "Incendio o humo", telefono: "100", urgente: true },
  { nombre: "Emergencias médicas", detalle: "SAME", telefono: "107", urgente: true },
  {
    nombre: "Fuga de gas",
    detalle: "Metrogas urgencias",
    telefono: "0800-333-4427",
    urgente: true,
  },
  {
    nombre: "Guardia de ascensores",
    detalle: "Ascensores Delta, 24 h",
    telefono: "11-4000-1234",
    urgente: true,
  },
  {
    nombre: "Encargado del edificio",
    detalle: "Lunes a viernes de 7 a 15",
    telefono: "11-5555-2200",
  },
  {
    nombre: "Administración",
    detalle: "Lunes a viernes de 9 a 18",
    telefono: "11-5555-9000",
  },
];

export type Conversacion = {
  id: string;
  canal: "app" | "whatsapp" | "email";
  contacto: string;
  unidad: string;
  ultimoMensaje: string;
  hora: string;
  estado: "bot" | "humano" | "cerrada";
  sinLeer: number;
};

export const conversaciones: Conversacion[] = [
  {
    id: "CV-1",
    canal: "whatsapp",
    contacto: "Mariana Duarte",
    unidad: "4° B",
    ultimoMensaje: "¿El plomero ya vino al cuarto piso?",
    hora: "10:42",
    estado: "humano",
    sinLeer: 2,
  },
  {
    id: "CV-2",
    canal: "app",
    contacto: "Julián Pérez",
    unidad: "2° A",
    ultimoMensaje: "Quiero reservar el SUM para el 16.",
    hora: "10:20",
    estado: "bot",
    sinLeer: 0,
  },
  {
    id: "CV-3",
    canal: "email",
    contacto: "Estudio Ramos",
    unidad: "6° C",
    ultimoMensaje: "Adjunto la nota por ruidos molestos.",
    hora: "09:05",
    estado: "humano",
    sinLeer: 1,
  },
  {
    id: "CV-4",
    canal: "whatsapp",
    contacto: "Sofía Lynch",
    unidad: "Torre Sur 12° A",
    ultimoMensaje: "Gracias, quedó resuelto.",
    hora: "Ayer",
    estado: "cerrada",
    sinLeer: 0,
  },
];

export type Proveedor = {
  id: string;
  nombre: string;
  rubro: string;
  telefono: string;
  ticketsAbiertos: number;
};

export const proveedores: Proveedor[] = [
  {
    id: "PR-1",
    nombre: "Plomería del Centro",
    rubro: "Plomería",
    telefono: "11-4444-1100",
    ticketsAbiertos: 2,
  },
  {
    id: "PR-2",
    nombre: "Electricidad Sur",
    rubro: "Electricidad",
    telefono: "11-4444-2200",
    ticketsAbiertos: 1,
  },
  {
    id: "PR-3",
    nombre: "Ascensores Delta",
    rubro: "Ascensores",
    telefono: "11-4444-3300",
    ticketsAbiertos: 0,
  },
];

export type Persona = {
  id: string;
  nombre: string;
  rol: RolId;
  unidad: string;
  consorcioId: string;
  email: string;
  telefono: string;
};

export const personas: Persona[] = [
  {
    id: "P-1",
    nombre: "Mariana Duarte",
    rol: "propietario",
    unidad: "4° B",
    consorcioId: "cons-01",
    email: "mariana.demo@heyvo.app",
    telefono: "11-5555-4001",
  },
  {
    id: "P-2",
    nombre: "Julián Pérez",
    rol: "inquilino",
    unidad: "2° A",
    consorcioId: "cons-01",
    email: "julian.demo@heyvo.app",
    telefono: "11-5555-4002",
  },
  {
    id: "P-3",
    nombre: "Ana Ferreyra",
    rol: "encargado",
    unidad: "PB",
    consorcioId: "cons-01",
    email: "ana.demo@heyvo.app",
    telefono: "11-5555-4003",
  },
  {
    id: "P-4",
    nombre: "Estudio Ramos",
    rol: "administrador",
    unidad: "—",
    consorcioId: "cons-01",
    email: "admin.demo@heyvo.app",
    telefono: "11-5555-9000",
  },
];

export type CuentaAdministradora = {
  id: string;
  nombre: string;
  plan: "Base" | "Pro" | "Enterprise";
  consorcios: number;
  unidades: number;
  mensajesMes: number;
  estado: "activa" | "prueba" | "suspendida";
};

export const cuentas: CuentaAdministradora[] = [
  {
    id: "AC-1",
    nombre: "Administración Demo",
    plan: "Pro",
    consorcios: 2,
    unidades: 162,
    mensajesMes: 4820,
    estado: "activa",
  },
  {
    id: "AC-2",
    nombre: "Estudio Belgrano",
    plan: "Base",
    consorcios: 5,
    unidades: 310,
    mensajesMes: 9140,
    estado: "prueba",
  },
  {
    id: "AC-3",
    nombre: "Grupo Costanera",
    plan: "Enterprise",
    consorcios: 21,
    unidades: 1840,
    mensajesMes: 41230,
    estado: "activa",
  },
  {
    id: "AC-4",
    nombre: "Consorcios del Oeste",
    plan: "Base",
    consorcios: 3,
    unidades: 148,
    mensajesMes: 610,
    estado: "suspendida",
  },
];

export const integraciones = [
  { nombre: "WhatsApp Business", estado: "no_configurada" as const },
  { nombre: "Email transaccional", estado: "no_configurada" as const },
  { nombre: "Mercado Pago", estado: "no_configurada" as const },
  { nombre: "ERP contable", estado: "no_configurada" as const },
  { nombre: "Firma digital", estado: "no_configurada" as const },
];

export const faqs = [
  {
    pregunta: "¿Cómo pago las expensas?",
    respuesta:
      "Desde Expensas podés ver la boleta del mes y pagarla con Mercado Pago. En el prototipo el pago es una simulación.",
  },
  {
    pregunta: "¿Cuánto tarda un reclamo?",
    respuesta:
      "Depende de la prioridad: alta entre 2 y 4 horas, media 24 horas y baja 72 horas.",
  },
  {
    pregunta: "¿Puedo reservar el SUM con deuda?",
    respuesta: "No. El reglamento pide estar al día con las expensas para reservar.",
  },
  {
    pregunta: "¿Dónde veo el reglamento?",
    respuesta: "En Documentos, dentro de la categoría Reglamento.",
  },
];

export function formatARS(monto: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(monto);
}

export function formatFecha(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}

export function formatFechaCorta(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(iso));
}

export function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const unidades = ["B", "KB", "MB", "GB"];
  let valor = bytes;
  let i = 0;
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i++;
  }
  return `${valor.toFixed(i === 0 ? 0 : 1).replace(".", ",")} ${unidades[i]}`;
}
