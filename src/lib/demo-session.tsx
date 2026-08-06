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
  reservas as reservasDemo,
  avisos as avisosDemo,
  mudanzas as mudanzasDemo,
  slaHoras,
  type Boleta,
  type Mudanza,
  type PrioridadTicket,
  type Reserva,
  type RolId,
  type Ticket,
  type Aviso,
} from "@/data/demo";

export type SolicitudCertificado = {
  id: string;
  tipoId: string;
  nombre: string;
  fecha: string;
  estado: "en_proceso" | "listo";
};

export type BoletaApp = Boleta & { unidadEtiqueta: string | null };
export type TicketApp = Ticket & { uuid: string };

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
  reservas: Reserva[];
  crearReserva: (input: { amenityId: string; fecha: string; franja: string }) => Reserva;
  cancelarReserva: (id: string) => void;
  avisos: Aviso[];
  marcarAvisoLeido: (id: string) => void;
  votos: Record<string, string>;
  votar: (votacionId: string, opcion: string) => void;
  certificados: SolicitudCertificado[];
  pedirCertificado: (tipoId: string, nombre: string) => void;
  mudanzas: Mudanza[];
  pedirMudanza: (input: {
    tipo: Mudanza["tipo"];
    fecha: string;
    franja: string;
  }) => Mudanza;
};

const DemoContext = createContext<DemoState | null>(null);

let contador = 1050;
const nuevoId = (prefijo: string) => `${prefijo}-${++contador}`;

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
          "id, codigo, titulo, categoria, descripcion, prioridad, estado, unidad_etiqueta, consorcio_id, canal, csat, created_at, vence_at, ticket_eventos(texto, created_at)",
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
        historial: ((t.ticket_eventos ?? []) as { texto: string; created_at: string }[])
          .slice()
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((e) => ({ fecha: e.created_at, texto: e.texto })),
      }));
    },
  });

  const boletas = useMemo(() => boletasQuery.data ?? [], [boletasQuery.data]);
  const tickets = useMemo(() => ticketsQuery.data ?? [], [ticketsQuery.data]);

  const [reservas, setReservas] = useState<Reserva[]>(reservasDemo);
  const [avisos, setAvisos] = useState<Aviso[]>(avisosDemo);
  const [votos, setVotos] = useState<Record<string, string>>({ "VT-0": "A favor" });
  const [certificados, setCertificados] = useState<SolicitudCertificado[]>([]);
  const [mudanzas, setMudanzas] = useState<Mudanza[]>(mudanzasDemo);

  const refrescar = useCallback(
    (clave: "boletas" | "tickets") =>
      queryClient.invalidateQueries({ queryKey: ["heyvo", clave] }),
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

  const crearReserva = useCallback<DemoState["crearReserva"]>((input) => {
    const reserva: Reserva = {
      id: nuevoId("RS"),
      amenityId: input.amenityId,
      fecha: input.fecha,
      franja: input.franja,
      unidad: "4° B",
      estado: "confirmada",
    };
    setReservas((prev) => [reserva, ...prev]);
    return reserva;
  }, []);

  const cancelarReserva = useCallback((id: string) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: "cancelada" as const } : r)),
    );
  }, []);

  const marcarAvisoLeido = useCallback((id: string) => {
    setAvisos((prev) => prev.map((a) => (a.id === id ? { ...a, leido: true } : a)));
  }, []);

  const votar = useCallback((votacionId: string, opcion: string) => {
    setVotos((prev) => ({ ...prev, [votacionId]: opcion }));
  }, []);

  const pedirCertificado = useCallback((tipoId: string, nombre: string) => {
    setCertificados((prev) => [
      {
        id: nuevoId("CE"),
        tipoId,
        nombre,
        fecha: new Date().toISOString(),
        estado: "en_proceso",
      },
      ...prev,
    ]);
  }, []);

  const pedirMudanza = useCallback<DemoState["pedirMudanza"]>((input) => {
    const id = nuevoId("MU");
    const mudanza: Mudanza = {
      id,
      tipo: input.tipo,
      fecha: input.fecha,
      franja: input.franja,
      unidad: "4° B",
      estado: "aprobada",
      codigo: `HEYVO-${id}`,
    };
    setMudanzas((prev) => [mudanza, ...prev]);
    return mudanza;
  }, []);

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
      reservas,
      crearReserva,
      cancelarReserva,
      avisos,
      marcarAvisoLeido,
      votos,
      votar,
      certificados,
      pedirCertificado,
      mudanzas,
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
      reservas,
      crearReserva,
      cancelarReserva,
      avisos,
      marcarAvisoLeido,
      votos,
      votar,
      certificados,
      pedirCertificado,
      mudanzas,
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
