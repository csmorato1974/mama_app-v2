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
      actividades: {
        Row: {
          contacto_id: string | null
          created_at: string
          created_by: string | null
          estado: string
          fecha: string
          hora: string | null
          id: string
          lugar: string | null
          notas: string | null
          prioridad: string
          recordatorio_min: number | null
          responsable: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          contacto_id?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha: string
          hora?: string | null
          id?: string
          lugar?: string | null
          notas?: string | null
          prioridad?: string
          recordatorio_min?: number | null
          responsable?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          contacto_id?: string | null
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          hora?: string | null
          id?: string
          lugar?: string | null
          notas?: string | null
          prioridad?: string
          recordatorio_min?: number | null
          responsable?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      administraciones: {
        Row: {
          administrado_en: string
          administrado_por: string | null
          created_at: string
          created_by: string | null
          dosis_administrada: string | null
          estado: string
          id: string
          medicamento_id: string
          notas: string | null
        }
        Insert: {
          administrado_en?: string
          administrado_por?: string | null
          created_at?: string
          created_by?: string | null
          dosis_administrada?: string | null
          estado?: string
          id?: string
          medicamento_id: string
          notas?: string | null
        }
        Update: {
          administrado_en?: string
          administrado_por?: string | null
          created_at?: string
          created_by?: string | null
          dosis_administrada?: string | null
          estado?: string
          id?: string
          medicamento_id?: string
          notas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administraciones_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          created_at: string
          detalle: Json | null
          id: string
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          detalle?: Json | null
          id?: string
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          detalle?: Json | null
          id?: string
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      constantes: {
        Row: {
          apetito: string | null
          created_at: string
          created_by: string | null
          deposiciones: string | null
          descanso: string | null
          diuresis_ml: number | null
          dolor: number | null
          edema: string | null
          frecuencia_cardiaca: number | null
          glucemia: number | null
          id: string
          ingesta_liquidos_ml: number | null
          medido_en: string
          nivel_conciencia: string | null
          observaciones: string | null
          origen: string
          peso: number | null
          presion_diastolica: number | null
          presion_sistolica: number | null
          saturacion: number | null
          sintomas: string[] | null
          temperatura: number | null
          updated_at: string
        }
        Insert: {
          apetito?: string | null
          created_at?: string
          created_by?: string | null
          deposiciones?: string | null
          descanso?: string | null
          diuresis_ml?: number | null
          dolor?: number | null
          edema?: string | null
          frecuencia_cardiaca?: number | null
          glucemia?: number | null
          id?: string
          ingesta_liquidos_ml?: number | null
          medido_en?: string
          nivel_conciencia?: string | null
          observaciones?: string | null
          origen?: string
          peso?: number | null
          presion_diastolica?: number | null
          presion_sistolica?: number | null
          saturacion?: number | null
          sintomas?: string[] | null
          temperatura?: number | null
          updated_at?: string
        }
        Update: {
          apetito?: string | null
          created_at?: string
          created_by?: string | null
          deposiciones?: string | null
          descanso?: string | null
          diuresis_ml?: number | null
          dolor?: number | null
          edema?: string | null
          frecuencia_cardiaca?: number | null
          glucemia?: number | null
          id?: string
          ingesta_liquidos_ml?: number | null
          medido_en?: string
          nivel_conciencia?: string | null
          observaciones?: string | null
          origen?: string
          peso?: number | null
          presion_diastolica?: number | null
          presion_sistolica?: number | null
          saturacion?: number | null
          sintomas?: string[] | null
          temperatura?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contactos: {
        Row: {
          activo: boolean
          areas_clinicas: string[] | null
          cargo: string | null
          categoria: string
          ciudad: string | null
          correo: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          disponibilidad: string | null
          en_equipo_actual: boolean
          es_contacto_emergencia: boolean
          especialidad: string | null
          foto_url: string | null
          horarios: string | null
          id: string
          institucion: string | null
          lugares_atencion: string | null
          motivo_referencia: string | null
          nombre: string
          observaciones: string | null
          parentesco: string | null
          permisos: string | null
          primera_consulta: string | null
          proxima_consulta: string | null
          recomendado_por: string | null
          responsabilidad: string | null
          telefono: string | null
          ultima_consulta: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          activo?: boolean
          areas_clinicas?: string[] | null
          cargo?: string | null
          categoria?: string
          ciudad?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          disponibilidad?: string | null
          en_equipo_actual?: boolean
          es_contacto_emergencia?: boolean
          especialidad?: string | null
          foto_url?: string | null
          horarios?: string | null
          id?: string
          institucion?: string | null
          lugares_atencion?: string | null
          motivo_referencia?: string | null
          nombre: string
          observaciones?: string | null
          parentesco?: string | null
          permisos?: string | null
          primera_consulta?: string | null
          proxima_consulta?: string | null
          recomendado_por?: string | null
          responsabilidad?: string | null
          telefono?: string | null
          ultima_consulta?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          activo?: boolean
          areas_clinicas?: string[] | null
          cargo?: string | null
          categoria?: string
          ciudad?: string | null
          correo?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          disponibilidad?: string | null
          en_equipo_actual?: boolean
          es_contacto_emergencia?: boolean
          especialidad?: string | null
          foto_url?: string | null
          horarios?: string | null
          id?: string
          institucion?: string | null
          lugares_atencion?: string | null
          motivo_referencia?: string | null
          nombre?: string
          observaciones?: string | null
          parentesco?: string | null
          permisos?: string | null
          primera_consulta?: string | null
          proxima_consulta?: string | null
          recomendado_por?: string | null
          responsabilidad?: string | null
          telefono?: string | null
          ultima_consulta?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          fecha: string
          id: string
          institucion: string | null
          mime_type: string | null
          profesional_id: string | null
          resumen: string | null
          storage_path: string | null
          texto_ocr: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          institucion?: string | null
          mime_type?: string | null
          profesional_id?: string | null
          resumen?: string | null
          storage_path?: string | null
          texto_ocr?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha?: string
          id?: string
          institucion?: string | null
          mime_type?: string | null
          profesional_id?: string | null
          resumen?: string | null
          storage_path?: string | null
          texto_ocr?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_clinicos: {
        Row: {
          categoria: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          documento_id: string | null
          especialidad: string | null
          fecha: string
          fecha_fin: string | null
          gravedad: string | null
          id: string
          institucion: string | null
          medicamento_id: string | null
          profesional_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          documento_id?: string | null
          especialidad?: string | null
          fecha: string
          fecha_fin?: string | null
          gravedad?: string | null
          id?: string
          institucion?: string | null
          medicamento_id?: string | null
          profesional_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          documento_id?: string | null
          especialidad?: string | null
          fecha?: string
          fecha_fin?: string | null
          gravedad?: string | null
          id?: string
          institucion?: string | null
          medicamento_id?: string | null
          profesional_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_clinicos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_clinicos_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_clinicos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria: string
          concepto: string
          created_at: string
          created_by: string | null
          documento_id: string | null
          estado: string
          extraordinario: boolean
          fecha: string
          id: string
          importe: number
          moneda: string
          notas: string | null
          proveedor: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string
          concepto: string
          created_at?: string
          created_by?: string | null
          documento_id?: string | null
          estado?: string
          extraordinario?: boolean
          fecha?: string
          id?: string
          importe?: number
          moneda?: string
          notas?: string | null
          proveedor?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          concepto?: string
          created_at?: string
          created_by?: string | null
          documento_id?: string | null
          estado?: string
          extraordinario?: boolean
          fecha?: string
          id?: string
          importe?: number
          moneda?: string
          notas?: string | null
          proveedor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          caducidad: string | null
          cantidad_disponible: number
          cantidad_recibida: number
          categoria: string
          consumo_diario: number | null
          created_at: string
          created_by: string | null
          fecha_entrega: string | null
          id: string
          lote: string | null
          notas: string | null
          presentacion: string | null
          producto: string
          proveedor: string | null
          proxima_entrega: string | null
          stock_minimo: number | null
          updated_at: string
        }
        Insert: {
          caducidad?: string | null
          cantidad_disponible?: number
          cantidad_recibida?: number
          categoria?: string
          consumo_diario?: number | null
          created_at?: string
          created_by?: string | null
          fecha_entrega?: string | null
          id?: string
          lote?: string | null
          notas?: string | null
          presentacion?: string | null
          producto: string
          proveedor?: string | null
          proxima_entrega?: string | null
          stock_minimo?: number | null
          updated_at?: string
        }
        Update: {
          caducidad?: string | null
          cantidad_disponible?: number
          cantidad_recibida?: number
          categoria?: string
          consumo_diario?: number | null
          created_at?: string
          created_by?: string | null
          fecha_entrega?: string | null
          id?: string
          lote?: string | null
          notas?: string | null
          presentacion?: string | null
          producto?: string
          proveedor?: string | null
          proxima_entrega?: string | null
          stock_minimo?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      medicamento_cambios: {
        Row: {
          created_by: string | null
          detalle: string | null
          fecha: string
          id: string
          medicamento_id: string
          tipo_cambio: string
        }
        Insert: {
          created_by?: string | null
          detalle?: string | null
          fecha?: string
          id?: string
          medicamento_id: string
          tipo_cambio: string
        }
        Update: {
          created_by?: string | null
          detalle?: string | null
          fecha?: string
          id?: string
          medicamento_id?: string
          tipo_cambio?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicamento_cambios_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamentos: {
        Row: {
          created_at: string
          created_by: string | null
          dosis: string | null
          estado: string
          fecha_inicio: string | null
          fecha_suspension: string | null
          frecuencia: string | null
          horarios: string[] | null
          id: string
          motivo: string | null
          nombre: string
          observaciones: string | null
          prescriptor_id: string | null
          principio_activo: string | null
          updated_at: string
          via: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dosis?: string | null
          estado?: string
          fecha_inicio?: string | null
          fecha_suspension?: string | null
          frecuencia?: string | null
          horarios?: string[] | null
          id?: string
          motivo?: string | null
          nombre: string
          observaciones?: string | null
          prescriptor_id?: string | null
          principio_activo?: string | null
          updated_at?: string
          via?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dosis?: string | null
          estado?: string
          fecha_inicio?: string | null
          fecha_suspension?: string | null
          frecuencia?: string | null
          horarios?: string[] | null
          id?: string
          motivo?: string | null
          nombre?: string
          observaciones?: string | null
          prescriptor_id?: string | null
          principio_activo?: string | null
          updated_at?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_prescriptor_id_fkey"
            columns: ["prescriptor_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          alergias: string | null
          created_at: string
          diagnostico_principal: string | null
          documento: string | null
          fecha_nacimiento: string | null
          grupo_sanguineo: string | null
          id: string
          modalidad_dialisis: string | null
          nombre: string
          notas: string | null
          peso_seco: number | null
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          created_at?: string
          diagnostico_principal?: string | null
          documento?: string | null
          fecha_nacimiento?: string | null
          grupo_sanguineo?: string | null
          id?: string
          modalidad_dialisis?: string | null
          nombre: string
          notas?: string | null
          peso_seco?: number | null
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          created_at?: string
          diagnostico_principal?: string | null
          documento?: string | null
          fecha_nacimiento?: string | null
          grupo_sanguineo?: string | null
          id?: string
          modalidad_dialisis?: string | null
          nombre?: string
          notas?: string | null
          peso_seco?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          nombre: string
          telefono: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reglas_alerta: {
        Row: {
          activa: boolean
          ambito: string
          campo: string
          created_at: string
          created_by: string | null
          id: string
          mensaje: string | null
          nombre: string
          operador: string
          severidad: string
          updated_at: string
          valor_max: number | null
          valor_min: number | null
        }
        Insert: {
          activa?: boolean
          ambito?: string
          campo: string
          created_at?: string
          created_by?: string | null
          id?: string
          mensaje?: string | null
          nombre: string
          operador?: string
          severidad?: string
          updated_at?: string
          valor_max?: number | null
          valor_min?: number | null
        }
        Update: {
          activa?: boolean
          ambito?: string
          campo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          mensaje?: string | null
          nombre?: string
          operador?: string
          severidad?: string
          updated_at?: string
          valor_max?: number | null
          valor_min?: number | null
        }
        Relationships: []
      }
      resultados_laboratorio: {
        Row: {
          area: string
          created_at: string
          created_by: string | null
          documento_id: string | null
          fecha: string
          fuera_de_rango: boolean | null
          id: string
          laboratorio: string | null
          parametro: string
          rango_max: number | null
          rango_min: number | null
          unidad: string | null
          valor: number | null
          valor_texto: string | null
        }
        Insert: {
          area?: string
          created_at?: string
          created_by?: string | null
          documento_id?: string | null
          fecha: string
          fuera_de_rango?: boolean | null
          id?: string
          laboratorio?: string | null
          parametro: string
          rango_max?: number | null
          rango_min?: number | null
          unidad?: string | null
          valor?: number | null
          valor_texto?: string | null
        }
        Update: {
          area?: string
          created_at?: string
          created_by?: string | null
          documento_id?: string | null
          fecha?: string
          fuera_de_rango?: boolean | null
          id?: string
          laboratorio?: string | null
          parametro?: string
          rango_max?: number | null
          rango_min?: number | null
          unidad?: string | null
          valor?: number | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resultados_laboratorio_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_dialisis: {
        Row: {
          alarmas: string | null
          aspecto_liquido: string | null
          cicladora: string | null
          concentracion: string | null
          created_at: string
          created_by: string | null
          duracion_min: number | null
          fecha: string
          hora_inicio: string | null
          id: string
          incidencias: string | null
          numero_bolsas: number | null
          observaciones: string | null
          peso_posterior: number | null
          peso_previo: number | null
          presion_diastolica: number | null
          presion_sistolica: number | null
          ultrafiltracion_ml: number | null
          updated_at: string
          volumen_drenado_ml: number | null
          volumen_infundido_ml: number | null
        }
        Insert: {
          alarmas?: string | null
          aspecto_liquido?: string | null
          cicladora?: string | null
          concentracion?: string | null
          created_at?: string
          created_by?: string | null
          duracion_min?: number | null
          fecha: string
          hora_inicio?: string | null
          id?: string
          incidencias?: string | null
          numero_bolsas?: number | null
          observaciones?: string | null
          peso_posterior?: number | null
          peso_previo?: number | null
          presion_diastolica?: number | null
          presion_sistolica?: number | null
          ultrafiltracion_ml?: number | null
          updated_at?: string
          volumen_drenado_ml?: number | null
          volumen_infundido_ml?: number | null
        }
        Update: {
          alarmas?: string | null
          aspecto_liquido?: string | null
          cicladora?: string | null
          concentracion?: string | null
          created_at?: string
          created_by?: string | null
          duracion_min?: number | null
          fecha?: string
          hora_inicio?: string | null
          id?: string
          incidencias?: string | null
          numero_bolsas?: number | null
          observaciones?: string | null
          peso_posterior?: number | null
          peso_previo?: number | null
          presion_diastolica?: number | null
          presion_sistolica?: number | null
          ultrafiltracion_ml?: number | null
          updated_at?: string
          volumen_drenado_ml?: number | null
          volumen_infundido_ml?: number | null
        }
        Relationships: []
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
        | "administrador"
        | "familiar"
        | "enfermeria"
        | "medico"
        | "lectura"
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
        "administrador",
        "familiar",
        "enfermeria",
        "medico",
        "lectura",
      ],
    },
  },
} as const
