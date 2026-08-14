import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  slaHoras,
  type Boleta,
  type PrioridadTicket,
  type RolId,
  type Ticket,
} from "@/data/demo";

export type SolicitudCertificado = {
  id: string;
  tipoId: string;
  nombre: string;
  fecha: string;
  estado: "en_proceso" | "listo";
};

export type DocumentoApp = {
  id: string;
  nombre: string;
  categoria: "Reglamento" | "Balance" | "Acta" | "Seguro" | "Contrato";
  fecha: string;
  pesoBytes: number | null;
  storagePath: string;
  soloPropietarios: boolean;
};

export type BoletaApp = Boleta & { unidadEtiqueta: string | null };
export type TicketApp = Ticket & { uuid: string; proveedorId: string | null };

export type PersonaApp = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: RolId;
  unidadEtiqueta: string | null;
};

export type ProveedorApp = {
  id: string;
  nombre: string;
  rubro: string;
  telefono: string | null;
  ticketsAbiertos: number;
};

export type NotificacionPrefs = {
  avisos: boolean;
  vencimientos: boolean;
  reclamos: boolean;
  asambleas: boolean;
};

export type AmenityApp = {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  reglas: string[];
  franjas: string[];
  requiereDeposito: number | null;
};

export type ReservaApp = {
  id: string;
  amenityId: string;
  fecha: string;
  franja: string;
  unidad: string;
  estado: "confirmada" | "pendiente" | "cancelada";
};

export type AvisoApp = {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: string;
  tipo: "informativo" | "urgente" | "mantenimiento";
  leido: boolean;
};

export type MudanzaApp = {
  id: string;
  tipo: "mudanza" | "flete" | "obra";
  fecha: string;
  franja: string;
  unidad: string;
  estado: "solicitada" | "aprobada" | "rechazada";
  codigo?: string;
};

export type VotacionApp = {
  id: string;
  tema: string;
  opciones: string[];
  votoEmitido?: string;
  resultado?: Record<string, number>;
};

export type AsambleaApp = {
  id: string;
  titulo: string;
  fecha: string;
  modalidad: "presencial" | "virtual" | "mixta";
  estado: "convocada" | "en_curso" | "cerrada";
  temario: string[];
  votaciones: VotacionApp[];
};

export type Sesion = {
  userId: string;
  email: string;
  nombre: string;
  rol: RolId;
  esAdmin: boolean;
  vinculado: boolean;
  personaId: string | null;
  unidadId: string | null;
  unidadEtiqueta: string | null;
  unidadM2: number | null;
  unidadCoeficiente: number | null;
  consorcioId: string | null;
  consorcioNombre: string | null;
  consorcioDireccion: string | null;
};

const rolesAdmin: RolId[] = ["administrador", "operador", "contable", "encargado"];

type DemoState = {
  sesion: Sesion | null;
  cargandoSesion: boolean;
  rol: RolId;
  autenticado: boolean;
  salir: () => Promise<void>;
  boletas: BoletaApp[];
  cargandoBoletas: boolean;
  pagarBoleta: (id: string) => Promise<void>;
  tickets: TicketApp[];
  cargandoTickets: boolean;
  crearTicket: (input: {
    titulo: string;
    categoria: string;
    descripcion: string;
    prioridad: PrioridadTicket;
  }) => Promise<TicketApp>;
  cerrarTicket: (id: string, csat: number) => Promise<void>;
  asignarProveedor: (ticketId: string, proveedorId: string, proveedorNombre: string) => Promise<void>;
  personas: PersonaApp[];
  cargandoPersonas: boolean;
  proveedores: ProveedorApp[];
  cargandoProveedores: boolean;
  notificacionPrefs: NotificacionPrefs;
  actualizarNotificacionPrefs: (input: Partial<NotificacionPrefs>) => Promise<void>;
  registrarRecordatorio: (boletaId: string) => Promise<void>;
  amenities: AmenityApp[];
  cargandoAmenities: boolean;
  crearAmenity: (input: {
    nombre: string;
    descripcion: string;
    capacidad: number;
    reglas: string[];
    franjas: string[];
    requiereDeposito: number | null;
  }) => Promise<void>;
  reservas: ReservaApp[];
  cargandoReservas: boolean;
  crearReserva: (input: { amenityId: string; fecha: string; franja: string }) => Promise<ReservaApp>;
  cancelarReserva: (id: string) => Promise<void>;
  avisos: AvisoApp[];
  cargandoAvisos: boolean;
  marcarAvisoLeido: (id: string) => Promise<void>;
  crearAviso: (input: { titulo: string; cuerpo: string; tipo: AvisoApp["tipo"] }) => Promise<void>;
  asambleas: AsambleaApp[];
  cargandoAsambleas: boolean;
  votar: (votacionId: string, opcion: string) => Promise<void>;
  crearAsamblea: (input: {
    titulo: string;
    fecha: string;
    modalidad: AsambleaApp["modalidad"];
    temario: string[];
  }) => Promise<void>;
  actualizarEstadoAsamblea: (id: string, estado: AsambleaApp["estado"]) => Promise<void>;
  agregarVotacion: (
    asambleaId: string,
    tema: string,
    opciones: string[],
    orden: number,
  ) => Promise<void>;
  documentos: DocumentoApp[];
  cargandoDocumentos: boolean;
  subirDocumento: (input: {
    file: File;
    nombre: string;
    categoria: DocumentoApp["categoria"];
    soloPropietarios: boolean;
  }) => Promise<void>;
  descargarDocumento: (doc: DocumentoApp) => Promise<string>;
  certificados: SolicitudCertificado[];
  cargandoCertificados: boolean;
  pedirCertificado: (tipoId: string, nombre: string) => Promise<void>;
  marcarCertificadoListo: (id: string) => Promise<void>;
  mudanzas: MudanzaApp[];
  cargandoMudanzas: boolean;
  pedirMudanza: (input: {
    tipo: MudanzaApp["tipo"];
    fecha: string;
    franja: string;
  }) => Promise<MudanzaApp>;
};

const DemoContext = createContext<DemoState | null>(null);

type FilaPersona = {
  id: string;
  nombre: string;
  rol: RolId;
  unidad_id: string | null;
  consorcio_id: string;
  unidades: { etiqueta: string; m2: number | null; coeficiente: number | null } | null;
  consorcios: { nombre: string; direccion: string | null } | null;
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authLista, setAuthLista] = useState(false);

  useEffect(() => {
    let vivo = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setUser(data.session?.user ?? null);
      setAuthLista(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sesion) => {
      if (
        evento !== "SIGNED_IN" &&
        evento !== "SIGNED_OUT" &&
        evento !== "USER_UPDATED"
      )
        return;
      setUser(sesion?.user ?? null);
      if (evento === "SIGNED_OUT") queryClient.clear();
      else void queryClient.invalidateQueries();
    });
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const sesionQuery = useQuery({
    queryKey: ["heyvo", "sesion", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Sesion> => {
      const uid = user!.id;
      const [{ data: persona }, { data: roles }] = await Promise.all([
        supabase
          .from("personas")
          .select(
            "id, nombre, rol, unidad_id, consorcio_id, unidades(etiqueta, m2, coeficiente), consorcios(nombre, direccion)",
          )
          .eq("user_id", uid)
          .eq("activo", true)
          .limit(1)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);

      const p = persona as FilaPersona | null;
      const esSuper = (roles ?? []).some((r) => r.role === "superadmin");
      const rol: RolId = esSuper ? "superadmin" : (p?.rol ?? "residente");

      return {
        userId: uid,
        email: user!.email ?? "",
        nombre: p?.nombre ?? (user!.user_metadata?.["full_name"] as string) ?? user!.email ?? "",
        rol,
        esAdmin: esSuper || rolesAdmin.includes(rol),
        vinculado: !!p,
        personaId: p?.id ?? null,
        unidadId: p?.unidad_id ?? null,
        unidadEtiqueta: p?.unidades?.etiqueta ?? null,
        unidadM2: p?.unidades?.m2 ?? null,
        unidadCoeficiente: p?.unidades?.coeficiente ?? null,
        consorcioId: p?.consorcio_id ?? null,
        consorcioNombre: p?.consorcios?.nombre ?? null,
        consorcioDireccion: p?.consorcios?.direccion ?? null,
      };
    },
  });

  const sesion = sesionQuery.data ?? null;

  const boletasQuery = useQuery({
    queryKey: ["heyvo", "boletas", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<BoletaApp[]> => {
      const { data, error } = await supabase
        .from("boletas")
        .select(
          "id, periodo, vencimiento, total, interes, estado, unidades(etiqueta), boleta_conceptos(concepto, monto, orden)",
        )
        .order("vencimiento", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b) => ({
        id: b.id,
        periodo: b.periodo,
        vencimiento: b.vencimiento,
        total: Number(b.total),
        ...(b.interes ? { interes: Number(b.interes) } : {}),
        estado: b.estado as Boleta["estado"],
        unidadEtiqueta: (b.unidades as { etiqueta: string } | null)?.etiqueta ?? null,
        detalle: ((b.boleta_conceptos ?? []) as { concepto: string; monto: number; orden: number }[])
          .slice()
          .sort((x, y) => x.orden - y.orden)
          .map((c) => ({ concepto: c.concepto, monto: Number(c.monto) })),
      }));
    },
  });

  const ticketsQuery = useQuery({
    queryKey: ["heyvo", "tickets", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<TicketApp[]> => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          "id, codigo, titulo, categoria, descripcion, prioridad, estado, unidad_etiqueta, consorcio_id, canal, csat, proveedor_id, created_at, vence_at, proveedores(nombre), ticket_eventos(texto, created_at)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t) => ({
        uuid: t.id,
        id: t.codigo ?? t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        descripcion: t.descripcion ?? "",
        prioridad: t.prioridad as PrioridadTicket,
        estado: t.estado as Ticket["estado"],
        unidad: t.unidad_etiqueta ?? "—",
        consorcioId: t.consorcio_id,
        creado: t.created_at,
        vence: t.vence_at ?? t.created_at,
        canal: t.canal as Ticket["canal"],
        ...(t.csat != null ? { csat: t.csat } : {}),
        proveedorId: t.proveedor_id,
        ...(t.proveedores?.nombre ? { asignadoA: t.proveedores.nombre } : {}),
        historial: ((t.ticket_eventos ?? []) as { texto: string; created_at: string }[])
          .slice()
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((e) => ({ fecha: e.created_at, texto: e.texto })),
      }));
    },
  });

  const personasQuery = useQuery({
    queryKey: ["heyvo", "personas", user?.id],
    enabled: !!sesion?.esAdmin,
    queryFn: async (): Promise<PersonaApp[]> => {
      const { data, error } = await supabase
        .from("personas")
        .select("id, nombre, email, telefono, rol, unidades(etiqueta)")
        .order("nombre");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        email: p.email,
        telefono: p.telefono,
        rol: p.rol as RolId,
        unidadEtiqueta: (p.unidades as { etiqueta: string } | null)?.etiqueta ?? null,
      }));
    },
  });

  const proveedoresQuery = useQuery({
    queryKey: ["heyvo", "proveedores", user?.id],
    enabled: !!sesion?.esAdmin,
    queryFn: async (): Promise<ProveedorApp[]> => {
      const [{ data, error }, { data: abiertos, error: errorAbiertos }] = await Promise.all([
        supabase.from("proveedores").select("id, nombre, rubro, telefono").order("nombre"),
        supabase
          .from("tickets")
          .select("proveedor_id")
          .not("proveedor_id", "is", null)
          .not("estado", "in", "(cerrado,resuelto)"),
      ]);
      if (error) throw error;
      if (errorAbiertos) throw errorAbiertos;
      const conteo = new Map<string, number>();
      for (const t of abiertos ?? []) {
        if (!t.proveedor_id) continue;
        conteo.set(t.proveedor_id, (conteo.get(t.proveedor_id) ?? 0) + 1);
      }
      return (data ?? []).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        rubro: p.rubro,
        telefono: p.telefono,
        ticketsAbiertos: conteo.get(p.id) ?? 0,
      }));
    },
  });

  const notificacionPrefsQuery = useQuery({
    queryKey: ["heyvo", "notificacion_prefs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NotificacionPrefs> => {
      const { data, error } = await supabase
        .from("notificacion_prefs")
        .select("avisos, vencimientos, reclamos, asambleas")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (
        data ?? { avisos: true, vencimientos: true, reclamos: true, asambleas: false }
      );
    },
  });

  const amenitiesQuery = useQuery({
    queryKey: ["heyvo", "amenities", sesion?.consorcioId],
    enabled: !!sesion?.consorcioId,
    queryFn: async (): Promise<AmenityApp[]> => {
      const { data, error } = await supabase
        .from("amenities")
        .select("id, nombre, descripcion, capacidad, reglas, franjas, requiere_deposito")
        .eq("consorcio_id", sesion!.consorcioId!)
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return (data ?? []).map((a) => ({
        id: a.id,
        nombre: a.nombre,
        descripcion: a.descripcion ?? "",
        capacidad: a.capacidad,
        reglas: a.reglas ?? [],
        franjas: a.franjas ?? [],
        requiereDeposito: a.requiere_deposito != null ? Number(a.requiere_deposito) : null,
      }));
    },
  });

  const reservasQuery = useQuery({
    queryKey: ["heyvo", "reservas", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<ReservaApp[]> => {
      const { data, error } = await supabase
        .from("reservas")
        .select("id, amenity_id, fecha, franja, estado, unidades(etiqueta)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        amenityId: r.amenity_id,
        fecha: r.fecha,
        franja: r.franja,
        unidad: (r.unidades as { etiqueta: string } | null)?.etiqueta ?? "—",
        estado: r.estado as ReservaApp["estado"],
      }));
    },
  });

  const avisosQuery = useQuery({
    queryKey: ["heyvo", "avisos", sesion?.consorcioId, user?.id],
    enabled: !!sesion?.consorcioId,
    queryFn: async (): Promise<AvisoApp[]> => {
      const [{ data: avisos, error }, { data: lecturas, error: errorLecturas }] = await Promise.all([
        supabase
          .from("avisos")
          .select("id, titulo, cuerpo, tipo, created_at")
          .eq("consorcio_id", sesion!.consorcioId!)
          .order("created_at", { ascending: false }),
        supabase.from("aviso_lecturas").select("aviso_id").eq("user_id", user!.id),
      ]);
      if (error) throw error;
      if (errorLecturas) throw errorLecturas;
      const leidos = new Set((lecturas ?? []).map((l) => l.aviso_id));
      return (avisos ?? []).map((a) => ({
        id: a.id,
        titulo: a.titulo,
        cuerpo: a.cuerpo,
        tipo: a.tipo as AvisoApp["tipo"],
        fecha: a.created_at,
        leido: leidos.has(a.id),
      }));
    },
  });

  const mudanzasQuery = useQuery({
    queryKey: ["heyvo", "mudanzas", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<MudanzaApp[]> => {
      const { data, error } = await supabase
        .from("mudanzas")
        .select("id, tipo, fecha, franja, estado, codigo, unidades(etiqueta)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => ({
        id: m.id,
        tipo: m.tipo as MudanzaApp["tipo"],
        fecha: m.fecha,
        franja: m.franja,
        unidad: (m.unidades as { etiqueta: string } | null)?.etiqueta ?? "—",
        estado: m.estado as MudanzaApp["estado"],
        ...(m.codigo ? { codigo: m.codigo } : {}),
      }));
    },
  });

  const asambleasQuery = useQuery({
    queryKey: ["heyvo", "asambleas", sesion?.consorcioId, user?.id],
    enabled: !!sesion?.consorcioId,
    queryFn: async (): Promise<AsambleaApp[]> => {
      const { data, error } = await supabase
        .from("asambleas")
        .select("id, titulo, fecha, modalidad, estado, temario, votaciones(id, tema, opciones, orden)")
        .eq("consorcio_id", sesion!.consorcioId!)
        .order("fecha", { ascending: false });
      if (error) throw error;

      const votacionIds = (data ?? []).flatMap((a) =>
        ((a.votaciones ?? []) as { id: string }[]).map((v) => v.id),
      );

      let votosPropios: { votacion_id: string; opcion: string }[] = [];
      let votosTotales: { votacion_id: string; opcion: string }[] = [];
      if (votacionIds.length > 0) {
        const [{ data: propios }, { data: totales }] = await Promise.all([
          supabase
            .from("votos")
            .select("votacion_id, opcion")
            .in("votacion_id", votacionIds)
            .eq("user_id", user!.id),
          supabase.from("votos").select("votacion_id, opcion").in("votacion_id", votacionIds),
        ]);
        votosPropios = propios ?? [];
        votosTotales = totales ?? [];
      }

      const propioPorVotacion = new Map(votosPropios.map((v) => [v.votacion_id, v.opcion]));
      const conteoPorVotacion = new Map<string, Map<string, number>>();
      for (const v of votosTotales) {
        const mapa = conteoPorVotacion.get(v.votacion_id) ?? new Map<string, number>();
        mapa.set(v.opcion, (mapa.get(v.opcion) ?? 0) + 1);
        conteoPorVotacion.set(v.votacion_id, mapa);
      }

      return (data ?? []).map((a) => ({
        id: a.id,
        titulo: a.titulo,
        fecha: a.fecha,
        modalidad: a.modalidad as AsambleaApp["modalidad"],
        estado: a.estado as AsambleaApp["estado"],
        temario: a.temario ?? [],
        votaciones: (
          (a.votaciones ?? []) as { id: string; tema: string; opciones: string[]; orden: number }[]
        )
          .slice()
          .sort((x, y) => x.orden - y.orden)
          .map((v) => {
            const conteo = conteoPorVotacion.get(v.id);
            const total = conteo ? [...conteo.values()].reduce((s, n) => s + n, 0) : 0;
            const resultado =
              a.estado === "cerrada" && total > 0
                ? Object.fromEntries(
                    v.opciones.map((o) => [o, Math.round(((conteo?.get(o) ?? 0) / total) * 100)]),
                  )
                : undefined;
            return {
              id: v.id,
              tema: v.tema,
              opciones: v.opciones,
              ...(propioPorVotacion.has(v.id) ? { votoEmitido: propioPorVotacion.get(v.id) } : {}),
              ...(resultado ? { resultado } : {}),
            };
          }),
      }));
    },
  });

  const documentosQuery = useQuery({
    queryKey: ["heyvo", "documentos", sesion?.consorcioId, sesion?.rol],
    enabled: !!sesion?.consorcioId,
    queryFn: async (): Promise<DocumentoApp[]> => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, nombre, categoria, storage_path, peso_bytes, solo_propietarios, created_at")
        .eq("consorcio_id", sesion!.consorcioId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d) => ({
        id: d.id,
        nombre: d.nombre,
        categoria: d.categoria as DocumentoApp["categoria"],
        fecha: d.created_at,
        pesoBytes: d.peso_bytes,
        storagePath: d.storage_path,
        soloPropietarios: d.solo_propietarios,
      }));
    },
  });

  const certificadosQuery = useQuery({
    queryKey: ["heyvo", "certificados", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<SolicitudCertificado[]> => {
      const { data, error } = await supabase
        .from("certificado_solicitudes")
        .select("id, tipo_id, nombre, estado, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id,
        tipoId: c.tipo_id,
        nombre: c.nombre,
        fecha: c.created_at,
        estado: c.estado as SolicitudCertificado["estado"],
      }));
    },
  });

  const boletas = useMemo(() => boletasQuery.data ?? [], [boletasQuery.data]);
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);
  const personas = useMemo(() => personasQuery.data ?? [], [personasQuery.data]);
  const proveedores = useMemo(() => proveedoresQuery.data ?? [], [proveedoresQuery.data]);
  const amenities = useMemo(() => amenitiesQuery.data ?? [], [amenitiesQuery.data]);
  const reservas = useMemo(() => reservasQuery.data ?? [], [reservasQuery.data]);
  const avisos = useMemo(() => avisosQuery.data ?? [], [avisosQuery.data]);
  const mudanzas = useMemo(() => mudanzasQuery.data ?? [], [mudanzasQuery.data]);
  const asambleas = useMemo(() => asambleasQuery.data ?? [], [asambleasQuery.data]);
  const documentos = useMemo(() => documentosQuery.data ?? [], [documentosQuery.data]);
  const certificados = useMemo(() => certificadosQuery.data ?? [], [certificadosQuery.data]);
  const notificacionPrefs = useMemo<NotificacionPrefs>(
    () =>
      notificacionPrefsQuery.data ?? {
        avisos: true,
        vencimientos: true,
        reclamos: true,
        asambleas: false,
      },
    [notificacionPrefsQuery.data],
  );

  const refrescar = useCallback(
    (
      clave:
        | "boletas"
        | "tickets"
        | "reservas"
        | "avisos"
        | "mudanzas"
        | "asambleas"
        | "amenities"
        | "documentos"
        | "certificados",
    ) => queryClient.invalidateQueries({ queryKey: ["heyvo", clave] }),
    [queryClient],
  );

  const pagarBoleta = useCallback<DemoState["pagarBoleta"]>(
    async (id) => {
      const boleta = boletas.find((b) => b.id === id);
      if (!sesion?.unidadId) throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const { error } = await supabase.from("pagos").insert({
        boleta_id: id,
        unidad_id: sesion.unidadId,
        pagado_por: sesion.userId,
        importe: (boleta?.total ?? 0) + (boleta?.interes ?? 0),
        medio: "mercado_pago_demo",
        estado: "aprobado",
      });
      if (error) throw error;
      await refrescar("boletas");
    },
    [boletas, refrescar, sesion],
  );

  const crearTicket = useCallback<DemoState["crearTicket"]>(
    async (input) => {
      if (!sesion?.consorcioId) throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const ahora = new Date();
      const vence = new Date(ahora.getTime() + slaHoras[input.prioridad] * 3600 * 1000);
      const codigo = `TK-${ahora.getTime().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          codigo,
          consorcio_id: sesion.consorcioId,
          unidad_id: sesion.unidadId,
          unidad_etiqueta: sesion.unidadEtiqueta,
          creado_por: sesion.userId,
          titulo: input.titulo,
          categoria: input.categoria,
          descripcion: input.descripcion,
          prioridad: input.prioridad,
          estado: "nuevo",
          canal: "app",
          vence_at: vence.toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("ticket_eventos").insert({
        ticket_id: data.id,
        autor: sesion.userId,
        texto: "Creaste el reclamo. Ya quedó registrado.",
      });
      await refrescar("tickets");
      return {
        uuid: data.id,
        id: codigo,
        titulo: input.titulo,
        categoria: input.categoria,
        descripcion: input.descripcion,
        prioridad: input.prioridad,
        estado: "nuevo",
        proveedorId: null,
        unidad: sesion.unidadEtiqueta ?? "—",
        consorcioId: sesion.consorcioId,
        creado: ahora.toISOString(),
        vence: vence.toISOString(),
        canal: "app",
        historial: [
          { fecha: ahora.toISOString(), texto: "Creaste el reclamo. Ya quedó registrado." },
        ],
      };
    },
    [refrescar, sesion],
  );

  const cerrarTicket = useCallback<DemoState["cerrarTicket"]>(
    async (id, csat) => {
      const ticket = tickets.find((t) => t.id === id || t.uuid === id);
      if (!ticket) return;
      const { error } = await supabase
        .from("tickets")
        .update({ estado: "cerrado", csat })
        .eq("id", ticket.uuid);
      if (error) throw error;
      await supabase.from("ticket_eventos").insert({
        ticket_id: ticket.uuid,
        autor: sesion?.userId ?? null,
        texto: `Cerraste el reclamo con una valoración de ${csat} de 5.`,
      });
      await refrescar("tickets");
    },
    [refrescar, sesion, tickets],
  );

  const asignarProveedor = useCallback<DemoState["asignarProveedor"]>(
    async (ticketId, proveedorId, proveedorNombre) => {
      const ticket = tickets.find((t) => t.id === ticketId || t.uuid === ticketId);
      if (!ticket) return;
      const { error } = await supabase
        .from("tickets")
        .update({ proveedor_id: proveedorId })
        .eq("id", ticket.uuid);
      if (error) throw error;
      await supabase.from("ticket_eventos").insert({
        ticket_id: ticket.uuid,
        autor: sesion?.userId ?? null,
        texto: `Se asignó a ${proveedorNombre}.`,
      });
      await refrescar("tickets");
    },
    [refrescar, sesion, tickets],
  );

  const actualizarNotificacionPrefs = useCallback<DemoState["actualizarNotificacionPrefs"]>(
    async (input) => {
      if (!user) return;
      const { error } = await supabase
        .from("notificacion_prefs")
        .upsert({ user_id: user.id, ...notificacionPrefs, ...input });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["heyvo", "notificacion_prefs"] });
    },
    [notificacionPrefs, queryClient, user],
  );

  const registrarRecordatorio = useCallback<DemoState["registrarRecordatorio"]>(
    async (boletaId) => {
      if (!sesion?.userId) throw new Error("Sesión no disponible.");
      const { error } = await supabase
        .from("boleta_recordatorios")
        .insert({ boleta_id: boletaId, enviado_por: sesion.userId });
      if (error) throw error;
    },
    [sesion],
  );

  const crearReserva = useCallback<DemoState["crearReserva"]>(
    async (input) => {
      if (!sesion?.unidadId || !sesion.consorcioId)
        throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const { data, error } = await supabase
        .from("reservas")
        .insert({
          consorcio_id: sesion.consorcioId,
          amenity_id: input.amenityId,
          unidad_id: sesion.unidadId,
          fecha: input.fecha,
          franja: input.franja,
          creado_por: sesion.userId,
        })
        .select("id, amenity_id, fecha, franja, estado")
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Ese turno ya está reservado.");
        throw error;
      }
      await refrescar("reservas");
      return {
        id: data.id,
        amenityId: data.amenity_id,
        fecha: data.fecha,
        franja: data.franja,
        unidad: sesion.unidadEtiqueta ?? "—",
        estado: data.estado as ReservaApp["estado"],
      };
    },
    [refrescar, sesion],
  );

  const cancelarReserva = useCallback<DemoState["cancelarReserva"]>(
    async (id) => {
      const { error } = await supabase
        .from("reservas")
        .update({ estado: "cancelada" })
        .eq("id", id);
      if (error) throw error;
      await refrescar("reservas");
    },
    [refrescar],
  );

  const marcarAvisoLeido = useCallback<DemoState["marcarAvisoLeido"]>(
    async (id) => {
      if (!user) return;
      const { error } = await supabase
        .from("aviso_lecturas")
        .upsert({ aviso_id: id, user_id: user.id });
      if (error) throw error;
      await refrescar("avisos");
    },
    [refrescar, user],
  );

  const crearAviso = useCallback<DemoState["crearAviso"]>(
    async (input) => {
      if (!sesion?.consorcioId) throw new Error("Sesión no disponible.");
      const { error } = await supabase.from("avisos").insert({
        consorcio_id: sesion.consorcioId,
        titulo: input.titulo,
        cuerpo: input.cuerpo,
        tipo: input.tipo,
        publicado_por: sesion.userId,
      });
      if (error) throw error;
      await refrescar("avisos");
    },
    [refrescar, sesion],
  );

  const votar = useCallback<DemoState["votar"]>(
    async (votacionId, opcion) => {
      if (!sesion?.unidadId) throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const { error } = await supabase.from("votos").upsert(
        {
          votacion_id: votacionId,
          unidad_id: sesion.unidadId,
          opcion,
          user_id: sesion.userId,
        },
        { onConflict: "votacion_id,unidad_id" },
      );
      if (error) throw error;
      await refrescar("asambleas");
    },
    [refrescar, sesion],
  );

  const pedirCertificado = useCallback<DemoState["pedirCertificado"]>(
    async (tipoId, nombre) => {
      if (!sesion?.consorcioId) throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const { error } = await supabase.from("certificado_solicitudes").insert({
        consorcio_id: sesion.consorcioId,
        unidad_id: sesion.unidadId,
        tipo_id: tipoId,
        nombre,
        solicitado_por: sesion.userId,
      });
      if (error) throw error;
      await refrescar("certificados");
    },
    [refrescar, sesion],
  );

  const marcarCertificadoListo = useCallback<DemoState["marcarCertificadoListo"]>(
    async (id) => {
      const { error } = await supabase
        .from("certificado_solicitudes")
        .update({ estado: "listo" })
        .eq("id", id);
      if (error) throw error;
      await refrescar("certificados");
    },
    [refrescar],
  );

  const crearAmenity = useCallback<DemoState["crearAmenity"]>(
    async (input) => {
      if (!sesion?.consorcioId) throw new Error("Sesión no disponible.");
      const { error } = await supabase.from("amenities").insert({
        consorcio_id: sesion.consorcioId,
        nombre: input.nombre,
        descripcion: input.descripcion,
        capacidad: input.capacidad,
        reglas: input.reglas,
        franjas: input.franjas,
        requiere_deposito: input.requiereDeposito,
      });
      if (error) throw error;
      await refrescar("amenities");
    },
    [refrescar, sesion],
  );

  const crearAsamblea = useCallback<DemoState["crearAsamblea"]>(
    async (input) => {
      if (!sesion?.consorcioId) throw new Error("Sesión no disponible.");
      const { error } = await supabase.from("asambleas").insert({
        consorcio_id: sesion.consorcioId,
        titulo: input.titulo,
        fecha: input.fecha,
        modalidad: input.modalidad,
        temario: input.temario,
      });
      if (error) throw error;
      await refrescar("asambleas");
    },
    [refrescar, sesion],
  );

  const actualizarEstadoAsamblea = useCallback<DemoState["actualizarEstadoAsamblea"]>(
    async (id, estado) => {
      const { error } = await supabase.from("asambleas").update({ estado }).eq("id", id);
      if (error) throw error;
      await refrescar("asambleas");
    },
    [refrescar],
  );

  const agregarVotacion = useCallback<DemoState["agregarVotacion"]>(
    async (asambleaId, tema, opciones, orden) => {
      const { error } = await supabase
        .from("votaciones")
        .insert({ asamblea_id: asambleaId, tema, opciones, orden });
      if (error) throw error;
      await refrescar("asambleas");
    },
    [refrescar],
  );

  const subirDocumento = useCallback<DemoState["subirDocumento"]>(
    async (input) => {
      if (!sesion?.consorcioId) throw new Error("Sesión no disponible.");
      const ext = input.file.name.includes(".") ? input.file.name.split(".").pop() : undefined;
      const path = `${sesion.consorcioId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
      const { error: errorSubida } = await supabase.storage
        .from("documentos")
        .upload(path, input.file);
      if (errorSubida) throw errorSubida;
      const { error } = await supabase.from("documentos").insert({
        consorcio_id: sesion.consorcioId,
        nombre: input.nombre,
        categoria: input.categoria,
        storage_path: path,
        peso_bytes: input.file.size,
        solo_propietarios: input.soloPropietarios,
        subido_por: sesion.userId,
      });
      if (error) throw error;
      await refrescar("documentos");
    },
    [refrescar, sesion],
  );

  const descargarDocumento = useCallback<DemoState["descargarDocumento"]>(async (doc) => {
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(doc.storagePath, 60);
    if (error) throw error;
    return data.signedUrl;
  }, []);

  const pedirMudanza = useCallback<DemoState["pedirMudanza"]>(
    async (input) => {
      if (!sesion?.unidadId || !sesion.consorcioId)
        throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const { data, error } = await supabase
        .from("mudanzas")
        .insert({
          consorcio_id: sesion.consorcioId,
          unidad_id: sesion.unidadId,
          tipo: input.tipo,
          fecha: input.fecha,
          franja: input.franja,
          solicitado_por: sesion.userId,
        })
        .select("id, tipo, fecha, franja, estado, codigo")
        .single();
      if (error) throw error;
      await refrescar("mudanzas");
      return {
        id: data.id,
        tipo: data.tipo as MudanzaApp["tipo"],
        fecha: data.fecha,
        franja: data.franja,
        unidad: sesion.unidadEtiqueta ?? "—",
        estado: data.estado as MudanzaApp["estado"],
        ...(data.codigo ? { codigo: data.codigo } : {}),
      };
    },
    [refrescar, sesion],
  );

  const salir = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }, [queryClient]);

  const value = useMemo<DemoState>(
    () => ({
      sesion,
      cargandoSesion: !authLista || (!!user && sesionQuery.isPending),
      rol: sesion?.rol ?? "residente",
      autenticado: !!user,
      salir,
      boletas,
      cargandoBoletas: boletasQuery.isPending && !!sesion?.vinculado,
      pagarBoleta,
      tickets,
      cargandoTickets: ticketsQuery.isPending && !!sesion?.vinculado,
      crearTicket,
      cerrarTicket,
      asignarProveedor,
      personas,
      cargandoPersonas: personasQuery.isPending && !!sesion?.esAdmin,
      proveedores,
      cargandoProveedores: proveedoresQuery.isPending && !!sesion?.esAdmin,
      notificacionPrefs,
      actualizarNotificacionPrefs,
      registrarRecordatorio,
      amenities,
      cargandoAmenities: amenitiesQuery.isPending && !!sesion?.consorcioId,
      crearAmenity,
      reservas,
      cargandoReservas: reservasQuery.isPending && !!sesion?.vinculado,
      crearReserva,
      cancelarReserva,
      avisos,
      cargandoAvisos: avisosQuery.isPending && !!sesion?.consorcioId,
      marcarAvisoLeido,
      crearAviso,
      asambleas,
      cargandoAsambleas: asambleasQuery.isPending && !!sesion?.consorcioId,
      votar,
      crearAsamblea,
      actualizarEstadoAsamblea,
      agregarVotacion,
      documentos,
      cargandoDocumentos: documentosQuery.isPending && !!sesion?.consorcioId,
      subirDocumento,
      descargarDocumento,
      certificados,
      cargandoCertificados: certificadosQuery.isPending && !!sesion?.vinculado,
      pedirCertificado,
      marcarCertificadoListo,
      mudanzas,
      cargandoMudanzas: mudanzasQuery.isPending && !!sesion?.vinculado,
      pedirMudanza,
    }),
    [
      sesion,
      authLista,
      user,
      sesionQuery.isPending,
      salir,
      boletas,
      boletasQuery.isPending,
      pagarBoleta,
      tickets,
      ticketsQuery.isPending,
      crearTicket,
      cerrarTicket,
      asignarProveedor,
      personas,
      personasQuery.isPending,
      proveedores,
      proveedoresQuery.isPending,
      notificacionPrefs,
      actualizarNotificacionPrefs,
      registrarRecordatorio,
      amenities,
      amenitiesQuery.isPending,
      crearAmenity,
      reservas,
      reservasQuery.isPending,
      crearReserva,
      cancelarReserva,
      avisos,
      avisosQuery.isPending,
      marcarAvisoLeido,
      crearAviso,
      asambleas,
      asambleasQuery.isPending,
      votar,
      crearAsamblea,
      actualizarEstadoAsamblea,
      agregarVotacion,
      documentos,
      documentosQuery.isPending,
      subirDocumento,
      descargarDocumento,
      certificados,
      certificadosQuery.isPending,
      pedirCertificado,
      marcarCertificadoListo,
      mudanzas,
      mudanzasQuery.isPending,
      pedirMudanza,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo debe usarse dentro de DemoProvider");
  return ctx;
}

export function puedePedirCertificado(rol: RolId, soloPropietarios: boolean) {
  if (!soloPropietarios) return true;
  return rol === "propietario" || rol === "administrador" || rol === "contable";
}
