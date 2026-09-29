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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_members: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_primary: boolean
          responsibility: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          responsibility?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          responsibility?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_services: {
        Row: {
          client_id: string
          created_at: string
          id: string
          scope_description: string | null
          service_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          scope_description?: string | null
          service_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          scope_description?: string | null
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          acquisition_source: string | null
          archived_at: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          created_by: string
          general_notes: string | null
          google_business_url: string | null
          health_status: Database["public"]["Enums"]["health_status"] | null
          id: string
          instagram_url: string | null
          internal_notes: string | null
          joined_at: string
          legal_name: string | null
          logo_path: string | null
          name: string
          segment: string | null
          sold_by_user_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          acquisition_source?: string | null
          archived_at?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by: string
          general_notes?: string | null
          google_business_url?: string | null
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          instagram_url?: string | null
          internal_notes?: string | null
          joined_at?: string
          legal_name?: string | null
          logo_path?: string | null
          name: string
          segment?: string | null
          sold_by_user_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          acquisition_source?: string | null
          archived_at?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string
          general_notes?: string | null
          google_business_url?: string | null
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          instagram_url?: string | null
          internal_notes?: string | null
          joined_at?: string
          legal_name?: string | null
          logo_path?: string | null
          name?: string
          segment?: string | null
          sold_by_user_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_sold_by_user_id_fkey"
            columns: ["sold_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_financials: {
        Row: {
          billing_day: number
          contract_id: string
          created_at: string
          monthly_value: number
          updated_at: string
        }
        Insert: {
          billing_day: number
          contract_id: string
          created_at?: string
          monthly_value: number
          updated_at?: string
        }
        Update: {
          billing_day?: number
          contract_id?: string
          created_at?: string
          monthly_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_financials_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          automatic_renewal: boolean
          client_id: string
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          scope_excluded: string | null
          scope_included: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          automatic_renewal?: boolean
          client_id: string
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          scope_excluded?: string | null
          scope_included?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          automatic_renewal?: boolean
          client_id?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          scope_excluded?: string | null
          scope_included?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          client_id: string
          contract_id: string | null
          created_at: string
          id: string
          mime_type: string
          name: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          client_id: string
          contract_id?: string | null
          created_at?: string
          id?: string
          mime_type: string
          name: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          client_id?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          mime_type?: string
          name?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          direction: Database["public"]["Enums"]["metric_direction"]
          id: string
          initial_value: number | null
          manual_current_value: number | null
          metric_id: string | null
          responsible_user_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["goal_status"]
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["metric_direction"]
          id?: string
          initial_value?: number | null
          manual_current_value?: number | null
          metric_id?: string | null
          responsible_user_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["metric_direction"]
          id?: string
          initial_value?: number | null
          manual_current_value?: number | null
          metric_id?: string | null
          responsible_user_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_entries: {
        Row: {
          created_at: string
          created_by: string
          id: string
          metric_id: string
          notes: string | null
          observed_at: string
          source: string | null
          value: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          metric_id: string
          notes?: string | null
          observed_at?: string
          source?: string | null
          value: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          metric_id?: string
          notes?: string | null
          observed_at?: string
          source?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_entries_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_units: {
        Row: {
          active: boolean
          format: string
          id: string
          key: string
          name: string
          sort_order: number
          symbol: string
        }
        Insert: {
          active?: boolean
          format?: string
          id?: string
          key: string
          name: string
          sort_order?: number
          symbol?: string
        }
        Update: {
          active?: boolean
          format?: string
          id?: string
          key?: string
          name?: string
          sort_order?: number
          symbol?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          archived_at: string | null
          baseline_date: string | null
          baseline_value: number | null
          category: string | null
          client_id: string
          created_at: string
          created_by: string
          default_direction: Database["public"]["Enums"]["metric_direction"]
          featured: boolean
          id: string
          name: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          baseline_date?: string | null
          baseline_value?: number | null
          category?: string | null
          client_id: string
          created_at?: string
          created_by: string
          default_direction?: Database["public"]["Enums"]["metric_direction"]
          featured?: boolean
          id?: string
          name: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          baseline_date?: string | null
          baseline_value?: number | null
          category?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          default_direction?: Database["public"]["Enums"]["metric_direction"]
          featured?: boolean
          id?: string
          name?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "metric_units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_path: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_path?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_path?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      weekly_update_results: {
        Row: {
          description: string | null
          id: string
          label: string
          sort_order: number
          value: string
          weekly_update_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          label: string
          sort_order?: number
          value: string
          weekly_update_id: string
        }
        Update: {
          description?: string | null
          id?: string
          label?: string
          sort_order?: number
          value?: string
          weekly_update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_update_results_weekly_update_id_fkey"
            columns: ["weekly_update_id"]
            isOneToOne: false
            referencedRelation: "weekly_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_updates: {
        Row: {
          actions_completed: string | null
          blockers: string | null
          client_id: string
          created_at: string
          health_status: Database["public"]["Enums"]["health_status"] | null
          id: string
          next_steps: string | null
          notes: string | null
          priority_next_action: string | null
          results_summary: string | null
          summary: string
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          actions_completed?: string | null
          blockers?: string | null
          client_id: string
          created_at?: string
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          next_steps?: string | null
          notes?: string | null
          priority_next_action?: string | null
          results_summary?: string | null
          summary: string
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          actions_completed?: string | null
          blockers?: string | null
          client_id?: string
          created_at?: string
          health_status?: Database["public"]["Enums"]["health_status"] | null
          id?: string
          next_steps?: string | null
          notes?: string | null
          priority_next_action?: string | null
          results_summary?: string | null
          summary?: string
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_updates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_last_updates"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "weekly_updates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_last_updates: {
        Row: {
          client_id: string | null
          days_without_update: number | null
          last_update_date: string | null
          priority_next_action: string | null
        }
        Relationships: []
      }
      latest_metric_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          metric_id: string | null
          observed_at: string | null
          source: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_entries_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_client_member: { Args: { target_client_id: string }; Returns: boolean }
      set_client_health: {
        Args: {
          next_health: Database["public"]["Enums"]["health_status"]
          target_client_id: string
        }
        Returns: undefined
      }
      storage_client_id: { Args: { object_name: string }; Returns: string }
    }
    Enums: {
      app_role: "ADMIN" | "COLLABORATOR"
      client_status: "ONBOARDING" | "ACTIVE" | "PAUSED" | "CLOSED"
      contract_status: "ACTIVE" | "IN_RENEWAL" | "ENDED" | "PAUSED"
      document_category:
        | "CONTRACT"
        | "BRIEFING"
        | "PLANNING"
        | "REPORT"
        | "CLIENT_MATERIAL"
        | "OTHER"
      goal_status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "ACHIEVED"
        | "PAUSED"
        | "CANCELLED"
      health_status: "HEALTHY" | "ATTENTION" | "CRITICAL"
      metric_direction: "INCREASE" | "DECREASE" | "NEUTRAL"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["ADMIN", "COLLABORATOR"],
      client_status: ["ONBOARDING", "ACTIVE", "PAUSED", "CLOSED"],
      contract_status: ["ACTIVE", "IN_RENEWAL", "ENDED", "PAUSED"],
      document_category: [
        "CONTRACT",
        "BRIEFING",
        "PLANNING",
        "REPORT",
        "CLIENT_MATERIAL",
        "OTHER",
      ],
      goal_status: [
        "NOT_STARTED",
        "IN_PROGRESS",
        "ACHIEVED",
        "PAUSED",
        "CANCELLED",
      ],
      health_status: ["HEALTHY", "ATTENTION", "CRITICAL"],
      metric_direction: ["INCREASE", "DECREASE", "NEUTRAL"],
    },
  },
} as const
