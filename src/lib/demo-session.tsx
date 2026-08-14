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
  amenityNombre: string;
  fecha: string;
  franja: string;
  unidadId: string;
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
  unidadId: string;
  unidad: string;
  estado: "solicitada" | "aprobada" | "rechazada";
  codigo: string | null;
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

export type BoletaApp = Boleta & { unidadEtiqueta: string | null };

export type TicketApp = Ticket & {
  uuid: string;
  proveedorId?: string;
  consorcioNombre?: string;
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
  amenities: AmenityApp[];
  reservas: ReservaApp[];
  cargandoReservas: boolean;
  crearReserva: (input: {
    amenityId: string;
    fecha: string;
    franja: string;
  }) => Promise<ReservaApp>;
  cancelarReserva: (id: string) => Promise<void>;
  avisos: AvisoApp[];
  cargandoAvisos: boolean;
  marcarAvisoLeido: (id: string) => Promise<void>;
  crearAviso: (input: {
    titulo: string;
    cuerpo: string;
    tipo: AvisoApp["tipo"];
  }) => Promise<void>;
  asambleas: AsambleaApp[];
  cargandoAsambleas: boolean;
  votos: Record<string, string>;
  votar: (votacionId: string, opcion: string) => Promise<void>;
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
          "id, codigo, titulo, categoria, descripcion, prioridad, estado, unidad_etiqueta, consorcio_id, proveedor_id, canal, csat, created_at, vence_at, proveedores(nombre), consorcios(nombre), ticket_eventos(texto, created_at)",
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
        ...(t.proveedor_id ? { proveedorId: t.proveedor_id } : {}),
        ...((t.proveedores as { nombre: string } | null)?.nombre
          ? { asignadoA: (t.proveedores as { nombre: string }).nombre }
          : {}),
        ...((t.consorcios as { nombre: string } | null)?.nombre
          ? { consorcioNombre: (t.consorcios as { nombre: string }).nombre }
          : {}),
        ...(t.csat != null ? { csat: t.csat } : {}),
        historial: ((t.ticket_eventos ?? []) as { texto: string; created_at: string }[])
          .slice()
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((e) => ({ fecha: e.created_at, texto: e.texto })),
      }));
    },
  });

  const boletas = useMemo(() => boletasQuery.data ?? [], [boletasQuery.data]);
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);

  const amenitiesQuery = useQuery({
    queryKey: ["heyvo", "amenities", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<AmenityApp[]> => {
      const { data, error } = await supabase
        .from("amenities")
        .select("id, nombre, descripcion, capacidad, reglas, franjas, requiere_deposito")
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
        .select("id, amenity_id, fecha, franja, estado, unidad_id, amenities(nombre), unidades(etiqueta)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        amenityId: r.amenity_id,
        amenityNombre: (r.amenities as { nombre: string } | null)?.nombre ?? "Espacio común",
        fecha: r.fecha,
        franja: r.franja,
        estado: r.estado as ReservaApp["estado"],
        unidadId: r.unidad_id,
        unidad: (r.unidades as { etiqueta: string } | null)?.etiqueta ?? "—",
      }));
    },
  });

  const avisosQuery = useQuery({
    queryKey: ["heyvo", "avisos", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<AvisoApp[]> => {
      const [{ data, error }, { data: lecturas }] = await Promise.all([
        supabase
          .from("avisos")
          .select("id, titulo, cuerpo, tipo, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("aviso_lecturas").select("aviso_id"),
      ]);
      if (error) throw error;
      const leidos = new Set((lecturas ?? []).map((l) => l.aviso_id));
      return (data ?? []).map((a) => ({
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
        .select("id, tipo, fecha, franja, estado, codigo, unidad_id, unidades(etiqueta)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => ({
        id: m.id,
        tipo: m.tipo as MudanzaApp["tipo"],
        fecha: m.fecha,
        franja: m.franja,
        estado: m.estado as MudanzaApp["estado"],
        codigo: m.codigo ?? null,
        unidadId: m.unidad_id,
        unidad: (m.unidades as { etiqueta: string } | null)?.etiqueta ?? "—",
      }));
    },
  });

  const asambleasQuery = useQuery({
    queryKey: ["heyvo", "asambleas", user?.id],
    enabled: !!sesion?.vinculado,
    queryFn: async (): Promise<AsambleaApp[]> => {
      const { data, error } = await supabase
        .from("asambleas")
        .select("id, titulo, fecha, modalidad, estado, temario, votaciones(id, tema, opciones, orden)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      const { data: votosRows } = await supabase
        .from("votos")
        .select("votacion_id, opcion, user_id");

      const mios = new Map<string, string>();
      const conteo = new Map<string, Map<string, number>>();
      for (const v of votosRows ?? []) {
        if (v.user_id === user?.id) mios.set(v.votacion_id, v.opcion);
        const porOpcion = conteo.get(v.votacion_id) ?? new Map<string, number>();
        porOpcion.set(v.opcion, (porOpcion.get(v.opcion) ?? 0) + 1);
        conteo.set(v.votacion_id, porOpcion);
      }

      return (data ?? []).map((a) => {
        const cerrada = a.estado === "cerrada";
        const votaciones = (
          (a.votaciones ?? []) as { id: string; tema: string; opciones: string[]; orden: number }[]
        )
          .slice()
          .sort((x, y) => x.orden - y.orden)
          .map((v): VotacionApp => {
            const voto = mios.get(v.id);
            const porOpcion = conteo.get(v.id);
            const total = porOpcion
              ? [...porOpcion.values()].reduce((s, n) => s + n, 0)
              : 0;
            const resultado =
              cerrada && porOpcion && total > 0
                ? Object.fromEntries(
                    v.opciones.map((o) => [
                      o,
                      Math.round(((porOpcion.get(o) ?? 0) / total) * 100),
                    ]),
                  )
                : undefined;
            return {
              id: v.id,
              tema: v.tema,
              opciones: v.opciones ?? [],
              ...(voto ? { votoEmitido: voto } : {}),
              ...(resultado ? { resultado } : {}),
            };
          });
        return {
          id: a.id,
          titulo: a.titulo,
          fecha: a.fecha,
          modalidad: a.modalidad as AsambleaApp["modalidad"],
          estado: a.estado as AsambleaApp["estado"],
          temario: a.temario ?? [],
          votaciones,
        };
      });
    },
  });

  const amenities = useMemo(() => amenitiesQuery.data ?? [], [amenitiesQuery.data]);
  const reservas = useMemo(() => reservasQuery.data ?? [], [reservasQuery.data]);
  const avisos = useMemo(() => avisosQuery.data ?? [], [avisosQuery.data]);
  const mudanzas = useMemo(() => mudanzasQuery.data ?? [], [mudanzasQuery.data]);
  const asambleas = useMemo(() => asambleasQuery.data ?? [], [asambleasQuery.data]);
  const votos = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of asambleas)
      for (const v of a.votaciones) if (v.votoEmitido) map[v.id] = v.votoEmitido;
    return map;
  }, [asambleas]);

  const refrescar = useCallback(
    (
      clave:
        | "boletas"
        | "tickets"
        | "reservas"
        | "avisos"
        | "mudanzas"
        | "asambleas",
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
          estado: "confirmada",
          creado_por: sesion.userId,
        })
        .select("id, amenities(nombre)")
        .single();
      if (error) throw error;
      await refrescar("reservas");
      return {
        id: data.id,
        amenityId: input.amenityId,
        amenityNombre:
          (data.amenities as { nombre: string } | null)?.nombre ?? "Espacio común",
        fecha: input.fecha,
        franja: input.franja,
        estado: "confirmada",
        unidadId: sesion.unidadId,
        unidad: sesion.unidadEtiqueta ?? "—",
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
      if (!sesion) return;
      const { error } = await supabase
        .from("aviso_lecturas")
        .upsert(
          { aviso_id: id, user_id: sesion.userId, leido_at: new Date().toISOString() },
          { onConflict: "aviso_id,user_id" },
        );
      if (error) throw error;
      await refrescar("avisos");
    },
    [refrescar, sesion],
  );

  const crearAviso = useCallback<DemoState["crearAviso"]>(
    async (input) => {
      if (!sesion?.consorcioId) throw new Error("No tenés un consorcio asignado.");
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
      if (!sesion?.unidadId)
        throw new Error("Tu cuenta todavía no está vinculada a una unidad.");
      const { error } = await supabase.from("votos").upsert(
        {
          votacion_id: votacionId,
          unidad_id: sesion.unidadId,
          user_id: sesion.userId,
          opcion,
        },
        { onConflict: "votacion_id,unidad_id" },
      );
      if (error) throw error;
      await refrescar("asambleas");
    },
    [refrescar, sesion],
  );

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
          estado: "solicitada",
          solicitado_por: sesion.userId,
        })
        .select("id, codigo, estado")
        .single();
      if (error) throw error;
      await refrescar("mudanzas");
      return {
        id: data.id,
        tipo: input.tipo,
        fecha: input.fecha,
        franja: input.franja,
        estado: data.estado as MudanzaApp["estado"],
        codigo: data.codigo ?? null,
        unidadId: sesion.unidadId,
        unidad: sesion.unidadEtiqueta ?? "—",
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
      amenities,
      reservas,
      cargandoReservas: reservasQuery.isPending && !!sesion?.vinculado,
      crearReserva,
      cancelarReserva,
      avisos,
      cargandoAvisos: avisosQuery.isPending && !!sesion?.vinculado,
      marcarAvisoLeido,
      crearAviso,
      asambleas,
      cargandoAsambleas: asambleasQuery.isPending && !!sesion?.vinculado,
      votos,
      votar,
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
      amenities,
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
      votos,
      votar,
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
