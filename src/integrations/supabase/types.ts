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
      consorcios: {
        Row: {
          created_at: string
          direccion: string
          es_demo: boolean
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion: string
          es_demo?: boolean
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string
          es_demo?: boolean
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
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
      canal_ticket: "app" | "whatsapp" | "email" | "telefono"
      estado_boleta: "paga" | "pendiente" | "vencida"
      estado_ticket:
        | "nuevo"
        | "validando"
        | "asignado"
        | "en_curso"
        | "esperando_tercero"
        | "resuelto"
        | "cerrado"
        | "reabierto"
      prioridad_ticket: "alta" | "media" | "baja"
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
      canal_ticket: ["app", "whatsapp", "email", "telefono"],
      estado_boleta: ["paga", "pendiente", "vencida"],
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
      prioridad_ticket: ["alta", "media", "baja"],
    },
  },
} as const
