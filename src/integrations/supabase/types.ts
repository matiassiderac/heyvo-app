export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          activo: boolean
          capacidad: number
          consorcio_id: string
          created_at: string
          descripcion: string | null
          franjas: string[]
          id: string
          nombre: string
          reglas: string[]
          requiere_deposito: number | null
        }
        Insert: {
          activo?: boolean
          capacidad?: number
          consorcio_id: string
          created_at?: string
          descripcion?: string | null
          franjas?: string[]
          id?: string
          nombre: string
          reglas?: string[]
          requiere_deposito?: number | null
        }
        Update: {
          activo?: boolean
          capacidad?: number
          consorcio_id?: string
          created_at?: string
          descripcion?: string | null
          franjas?: string[]
          id?: string
          nombre?: string
          reglas?: string[]
          requiere_deposito?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amenities_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
        ]
      }
      asambleas: {
        Row: {
          consorcio_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_asamblea"]
          fecha: string
          id: string
          modalidad: Database["public"]["Enums"]["modalidad_asamblea"]
          temario: string[]
          titulo: string
          updated_at: string
        }
        Insert: {
          consorcio_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_asamblea"]
          fecha: string
          id?: string
          modalidad: Database["public"]["Enums"]["modalidad_asamblea"]
          temario?: string[]
          titulo: string
          updated_at?: string
        }
        Update: {
          consorcio_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_asamblea"]
          fecha?: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_asamblea"]
          temario?: string[]
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asambleas_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
        ]
      }
      aviso_lecturas: {
        Row: {
          aviso_id: string
          leido_at: string
          user_id: string
        }
        Insert: {
          aviso_id: string
          leido_at?: string
          user_id: string
        }
        Update: {
          aviso_id?: string
          leido_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aviso_lecturas_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "avisos"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos: {
        Row: {
          consorcio_id: string
          created_at: string
          cuerpo: string
          id: string
          publicado_por: string | null
          tipo: Database["public"]["Enums"]["tipo_aviso"]
          titulo: string
        }
        Insert: {
          consorcio_id: string
          created_at?: string
          cuerpo: string
          id?: string
          publicado_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_aviso"]
          titulo: string
        }
        Update: {
          consorcio_id?: string
          created_at?: string
          cuerpo?: string
          id?: string
          publicado_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_aviso"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
        ]
      }
      boleta_conceptos: {
        Row: {
          boleta_id: string
          concepto: string
          id: string
          monto: number
          orden: number
        }
        Insert: {
          boleta_id: string
          concepto: string
          id?: string
          monto?: number
          orden?: number
        }
        Update: {
          boleta_id?: string
          concepto?: string
          id?: string
          monto?: number
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "boleta_conceptos_boleta_id_fkey"
            columns: ["boleta_id"]
            isOneToOne: false
            referencedRelation: "boletas"
            referencedColumns: ["id"]
          },
        ]
      }
      boleta_recordatorios: {
        Row: {
          boleta_id: string
          created_at: string
          enviado_por: string
          id: string
        }
        Insert: {
          boleta_id: string
          created_at?: string
          enviado_por: string
          id?: string
        }
        Update: {
          boleta_id?: string
          created_at?: string
          enviado_por?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boleta_recordatorios_boleta_id_fkey"
            columns: ["boleta_id"]
            isOneToOne: false
            referencedRelation: "boletas"
            referencedColumns: ["id"]
          },
        ]
      }
      boletas: {
        Row: {
          consorcio_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_boleta"]
          id: string
          interes: number
          periodo: string
          total: number
          unidad_id: string
          updated_at: string
          vencimiento: string
        }
        Insert: {
          consorcio_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_boleta"]
          id?: string
          interes?: number
          periodo: string
          total?: number
          unidad_id: string
          updated_at?: string
          vencimiento: string
        }
        Update: {
          consorcio_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_boleta"]
          id?: string
          interes?: number
          periodo?: string
          total?: number
          unidad_id?: string
          updated_at?: string
          vencimiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "boletas_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boletas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      certificado_solicitudes: {
        Row: {
          consorcio_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_certificado"]
          id: string
          nombre: string
          solicitado_por: string
          tipo_id: string
          unidad_id: string | null
          updated_at: string
        }
        Insert: {
          consorcio_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_certificado"]
          id?: string
          nombre: string
          solicitado_por: string
          tipo_id: string
          unidad_id?: string | null
          updated_at?: string
        }
        Update: {
          consorcio_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_certificado"]
          id?: string
          nombre?: string
          solicitado_por?: string
          tipo_id?: string
          unidad_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificado_solicitudes_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificado_solicitudes_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      consorcios: {
        Row: {
          created_at: string
          cuenta_id: string | null
          direccion: string
          es_demo: boolean
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuenta_id?: string | null
          direccion: string
          es_demo?: boolean
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuenta_id?: string | null
          direccion?: string
          es_demo?: boolean
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consorcios_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      conversacion_mensajes: {
        Row: {
          autor: Database["public"]["Enums"]["autor_mensaje"]
          conversacion_id: string
          created_at: string
          id: string
          texto: string
          user_id: string | null
        }
        Insert: {
          autor: Database["public"]["Enums"]["autor_mensaje"]
          conversacion_id: string
          created_at?: string
          id?: string
          texto: string
          user_id?: string | null
        }
        Update: {
          autor?: Database["public"]["Enums"]["autor_mensaje"]
          conversacion_id?: string
          created_at?: string
          id?: string
          texto?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversacion_mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      conversaciones: {
        Row: {
          asignado_a: string | null
          asunto: string
          canal: Database["public"]["Enums"]["canal_ticket"]
          consorcio_id: string
          contacto: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_conversacion"]
          id: string
          iniciada_por: string | null
          sin_leer_admin: number
          ultimo_mensaje: string | null
          ultimo_mensaje_at: string
          unidad_etiqueta: string | null
          unidad_id: string | null
          updated_at: string
        }
        Insert: {
          asignado_a?: string | null
          asunto?: string
          canal?: Database["public"]["Enums"]["canal_ticket"]
          consorcio_id: string
          contacto: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_conversacion"]
          id?: string
          iniciada_por?: string | null
          sin_leer_admin?: number
          ultimo_mensaje?: string | null
          ultimo_mensaje_at?: string
          unidad_etiqueta?: string | null
          unidad_id?: string | null
          updated_at?: string
        }
        Update: {
          asignado_a?: string | null
          asunto?: string
          canal?: Database["public"]["Enums"]["canal_ticket"]
          consorcio_id?: string
          contacto?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_conversacion"]
          id?: string
          iniciada_por?: string | null
          sin_leer_admin?: number
          ultimo_mensaje?: string | null
          ultimo_mensaje_at?: string
          unidad_etiqueta?: string | null
          unidad_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      cuenta_miembros: {
        Row: {
          created_at: string
          cuenta_id: string
          id: string
          rol: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          cuenta_id: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          cuenta_id?: string
          id?: string
          rol?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuenta_miembros_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_cuenta"]
          id: string
          nombre: string
          plan: Database["public"]["Enums"]["plan_cuenta"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"]
          id?: string
          nombre: string
          plan?: Database["public"]["Enums"]["plan_cuenta"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"]
          id?: string
          nombre?: string
          plan?: Database["public"]["Enums"]["plan_cuenta"]
          updated_at?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_documento"]
          consorcio_id: string
          created_at: string
          id: string
          nombre: string
          peso_bytes: number | null
          solo_propietarios: boolean
          storage_path: string
          subido_por: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_documento"]
          consorcio_id: string
          created_at?: string
          id?: string
          nombre: string
          peso_bytes?: number | null
          solo_propietarios?: boolean
          storage_path: string
          subido_por?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_documento"]
          consorcio_id?: string
          created_at?: string
          id?: string
          nombre?: string
          peso_bytes?: number | null
          solo_propietarios?: boolean
          storage_path?: string
          subido_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
        ]
      }
      mudanzas: {
        Row: {
          codigo: string | null
          consorcio_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_mudanza"]
          fecha: string
          franja: string
          id: string
          solicitado_por: string
          tipo: Database["public"]["Enums"]["tipo_mudanza"]
          unidad_id: string
        }
        Insert: {
          codigo?: string | null
          consorcio_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_mudanza"]
          fecha: string
          franja: string
          id?: string
          solicitado_por: string
          tipo: Database["public"]["Enums"]["tipo_mudanza"]
          unidad_id: string
        }
        Update: {
          codigo?: string | null
          consorcio_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_mudanza"]
          fecha?: string
          franja?: string
          id?: string
          solicitado_por?: string
          tipo?: Database["public"]["Enums"]["tipo_mudanza"]
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mudanzas_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudanzas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacion_prefs: {
        Row: {
          asambleas: boolean
          avisos: boolean
          reclamos: boolean
          updated_at: string
          user_id: string
          vencimientos: boolean
        }
        Insert: {
          asambleas?: boolean
          avisos?: boolean
          reclamos?: boolean
          updated_at?: string
          user_id: string
          vencimientos?: boolean
        }
        Update: {
          asambleas?: boolean
          avisos?: boolean
          reclamos?: boolean
          updated_at?: string
          user_id?: string
          vencimientos?: boolean
        }
        Relationships: []
      }
      pago_eventos: {
        Row: {
          created_at: string
          estado_reportado: string | null
          evento_id: string
          id: string
          intento_id: string | null
          payload: Json
          procesado: boolean
          tipo: string
        }
        Insert: {
          created_at?: string
          estado_reportado?: string | null
          evento_id: string
          id?: string
          intento_id?: string | null
          payload?: Json
          procesado?: boolean
          tipo: string
        }
        Update: {
          created_at?: string
          estado_reportado?: string | null
          evento_id?: string
          id?: string
          intento_id?: string | null
          payload?: Json
          procesado?: boolean
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pago_eventos_intento_id_fkey"
            columns: ["intento_id"]
            isOneToOne: false
            referencedRelation: "pago_intentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pago_intentos: {
        Row: {
          boleta_id: string
          checkout_url: string | null
          consorcio_id: string
          creado_por: string
          created_at: string
          detalle: string | null
          estado: Database["public"]["Enums"]["estado_pago_intento"]
          id: string
          importe: number
          proveedor: string
          referencia_externa: string
          unidad_id: string
          updated_at: string
        }
        Insert: {
          boleta_id: string
          checkout_url?: string | null
          consorcio_id: string
          creado_por: string
          created_at?: string
          detalle?: string | null
          estado?: Database["public"]["Enums"]["estado_pago_intento"]
          id?: string
          importe: number
          proveedor?: string
          referencia_externa: string
          unidad_id: string
          updated_at?: string
        }
        Update: {
          boleta_id?: string
          checkout_url?: string | null
          consorcio_id?: string
          creado_por?: string
          created_at?: string
          detalle?: string | null
          estado?: Database["public"]["Enums"]["estado_pago_intento"]
          id?: string
          importe?: number
          proveedor?: string
          referencia_externa?: string
          unidad_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pago_intentos_boleta_id_fkey"
            columns: ["boleta_id"]
            isOneToOne: false
            referencedRelation: "boletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_intentos_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_intentos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          boleta_id: string
          created_at: string
          estado: string
          id: string
          importe: number
          medio: string
          pagado_por: string | null
          referencia: string | null
          unidad_id: string
        }
        Insert: {
          boleta_id: string
          created_at?: string
          estado?: string
          id?: string
          importe: number
          medio?: string
          pagado_por?: string | null
          referencia?: string | null
          unidad_id: string
        }
        Update: {
          boleta_id?: string
          created_at?: string
          estado?: string
          id?: string
          importe?: number
          medio?: string
          pagado_por?: string | null
          referencia?: string | null
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_boleta_id_fkey"
            columns: ["boleta_id"]
            isOneToOne: false
            referencedRelation: "boletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          activo: boolean
          consorcio_id: string
          created_at: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["app_role"]
          telefono: string | null
          unidad_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean
          consorcio_id: string
          created_at?: string
          email: string
          id?: string
          nombre: string
          rol?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          unidad_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean
          consorcio_id?: string
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          unidad_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nombre?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          consorcio_id: string
          created_at: string
          id: string
          nombre: string
          rubro: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          consorcio_id: string
          created_at?: string
          id?: string
          nombre: string
          rubro: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          consorcio_id?: string
          created_at?: string
          id?: string
          nombre?: string
          rubro?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          amenity_id: string
          consorcio_id: string
          creado_por: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_reserva"]
          fecha: string
          franja: string
          id: string
          unidad_id: string
        }
        Insert: {
          amenity_id: string
          consorcio_id: string
          creado_por: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_reserva"]
          fecha: string
          franja: string
          id?: string
          unidad_id: string
        }
        Update: {
          amenity_id?: string
          consorcio_id?: string
          creado_por?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_reserva"]
          fecha?: string
          franja?: string
          id?: string
          unidad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_eventos: {
        Row: {
          autor: string | null
          created_at: string
          id: string
          texto: string
          ticket_id: string
        }
        Insert: {
          autor?: string | null
          created_at?: string
          id?: string
          texto: string
          ticket_id: string
        }
        Update: {
          autor?: string | null
          created_at?: string
          id?: string
          texto?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_eventos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          canal: Database["public"]["Enums"]["canal_ticket"]
          categoria: string
          codigo: string | null
          consorcio_id: string
          creado_por: string | null
          created_at: string
          csat: number | null
          descripcion: string
          estado: Database["public"]["Enums"]["estado_ticket"]
          id: string
          prioridad: Database["public"]["Enums"]["prioridad_ticket"]
          proveedor_id: string | null
          titulo: string
          unidad_etiqueta: string | null
          unidad_id: string | null
          updated_at: string
          vence_at: string | null
        }
        Insert: {
          canal?: Database["public"]["Enums"]["canal_ticket"]
          categoria: string
          codigo?: string | null
          consorcio_id: string
          creado_por?: string | null
          created_at?: string
          csat?: number | null
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_ticket"]
          proveedor_id?: string | null
          titulo: string
          unidad_etiqueta?: string | null
          unidad_id?: string | null
          updated_at?: string
          vence_at?: string | null
        }
        Update: {
          canal?: Database["public"]["Enums"]["canal_ticket"]
          categoria?: string
          codigo?: string | null
          consorcio_id?: string
          creado_por?: string | null
          created_at?: string
          csat?: number | null
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_ticket"]
          id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_ticket"]
          proveedor_id?: string | null
          titulo?: string
          unidad_etiqueta?: string | null
          unidad_id?: string | null
          updated_at?: string
          vence_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      torres: {
        Row: {
          consorcio_id: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          consorcio_id: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          consorcio_id?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "torres_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          coeficiente: number | null
          consorcio_id: string
          created_at: string
          depto: string | null
          etiqueta: string
          id: string
          m2: number | null
          piso: string | null
          torre_id: string | null
        }
        Insert: {
          coeficiente?: number | null
          consorcio_id: string
          created_at?: string
          depto?: string | null
          etiqueta: string
          id?: string
          m2?: number | null
          piso?: string | null
          torre_id?: string | null
        }
        Update: {
          coeficiente?: number | null
          consorcio_id?: string
          created_at?: string
          depto?: string | null
          etiqueta?: string
          id?: string
          m2?: number | null
          piso?: string | null
          torre_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_consorcio_id_fkey"
            columns: ["consorcio_id"]
            isOneToOne: false
            referencedRelation: "consorcios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votaciones: {
        Row: {
          asamblea_id: string
          id: string
          opciones: string[]
          orden: number
          tema: string
        }
        Insert: {
          asamblea_id: string
          id?: string
          opciones: string[]
          orden?: number
          tema: string
        }
        Update: {
          asamblea_id?: string
          id?: string
          opciones?: string[]
          orden?: number
          tema?: string
        }
        Relationships: [
          {
            foreignKeyName: "votaciones_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: false
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
        ]
      }
      votos: {
        Row: {
          created_at: string
          id: string
          opcion: string
          unidad_id: string
          user_id: string
          votacion_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opcion: string
          unidad_id: string
          user_id: string
          votacion_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opcion?: string
          unidad_id?: string
          user_id?: string
          votacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_votacion_id_fkey"
            columns: ["votacion_id"]
            isOneToOne: false
            referencedRelation: "votaciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "residente"
        | "propietario"
        | "inquilino"
        | "encargado"
        | "administrador"
        | "operador"
        | "contable"
        | "proveedor"
        | "superadmin"
      autor_mensaje: "vecino" | "asistente" | "operador"
      canal_ticket: "app" | "whatsapp" | "email" | "telefono"
      categoria_documento:
        | "Reglamento"
        | "Balance"
        | "Acta"
        | "Seguro"
        | "Contrato"
      estado_asamblea: "convocada" | "en_curso" | "cerrada"
      estado_boleta: "paga" | "pendiente" | "vencida"
      estado_certificado: "en_proceso" | "listo"
      estado_conversacion: "bot" | "esperando_humano" | "humano" | "cerrada"
      estado_cuenta: "activa" | "prueba" | "suspendida"
      estado_mudanza: "solicitada" | "aprobada" | "rechazada"
      estado_pago_intento: "pendiente" | "aprobado" | "rechazado" | "expirado"
      estado_reserva: "confirmada" | "pendiente" | "cancelada"
      estado_ticket:
        | "nuevo"
        | "validando"
        | "asignado"
        | "en_curso"
        | "esperando_tercero"
        | "resuelto"
        | "cerrado"
        | "reabierto"
      modalidad_asamblea: "presencial" | "virtual" | "mixta"
      plan_cuenta: "base" | "pro" | "enterprise"
      prioridad_ticket: "alta" | "media" | "baja"
      tipo_aviso: "informativo" | "urgente" | "mantenimiento"
      tipo_mudanza: "mudanza" | "flete" | "obra"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "residente",
        "propietario",
        "inquilino",
        "encargado",
        "administrador",
        "operador",
        "contable",
        "proveedor",
        "superadmin",
      ],
      autor_mensaje: ["vecino", "asistente", "operador"],
      canal_ticket: ["app", "whatsapp", "email", "telefono"],
      categoria_documento: [
        "Reglamento",
        "Balance",
        "Acta",
        "Seguro",
        "Contrato",
      ],
      estado_asamblea: ["convocada", "en_curso", "cerrada"],
      estado_boleta: ["paga", "pendiente", "vencida"],
      estado_certificado: ["en_proceso", "listo"],
      estado_conversacion: ["bot", "esperando_humano", "humano", "cerrada"],
      estado_cuenta: ["activa", "prueba", "suspendida"],
      estado_mudanza: ["solicitada", "aprobada", "rechazada"],
      estado_pago_intento: ["pendiente", "aprobado", "rechazado", "expirado"],
      estado_reserva: ["confirmada", "pendiente", "cancelada"],
      estado_ticket: [
        "nuevo",
        "validando",
        "asignado",
        "en_curso",
        "esperando_tercero",
        "resuelto",
        "cerrado",
        "reabierto",
      ],
      modalidad_asamblea: ["presencial", "virtual", "mixta"],
      plan_cuenta: ["base", "pro", "enterprise"],
      prioridad_ticket: ["alta", "media", "baja"],
      tipo_aviso: ["informativo", "urgente", "mantenimiento"],
      tipo_mudanza: ["mudanza", "flete", "obra"],
    },
  },
} as const
