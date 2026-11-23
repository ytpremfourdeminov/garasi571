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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      car_credit_simulations: {
        Row: {
          car_id: string
          created_at: string
          dp: number
          id: string
          installment: number | null
          installment_label: string
          label: string
          note: string | null
          provider: string | null
          sort_order: number
          tenor_years: number
        }
        Insert: {
          car_id: string
          created_at?: string
          dp: number
          id?: string
          installment?: number | null
          installment_label: string
          label: string
          note?: string | null
          provider?: string | null
          sort_order?: number
          tenor_years: number
        }
        Update: {
          car_id?: string
          created_at?: string
          dp?: number
          id?: string
          installment?: number | null
          installment_label?: string
          label?: string
          note?: string | null
          provider?: string | null
          sort_order?: number
          tenor_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_credit_simulations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      car_images: {
        Row: {
          alt: string
          angle_tag: string
          car_id: string
          created_at: string
          height: number
          id: string
          is_cover: boolean
          r2_key: string
          sort_order: number
          url: string
          width: number
        }
        Insert: {
          alt: string
          angle_tag?: string
          car_id: string
          created_at?: string
          height?: number
          id?: string
          is_cover?: boolean
          r2_key: string
          sort_order?: number
          url: string
          width?: number
        }
        Update: {
          alt?: string
          angle_tag?: string
          car_id?: string
          created_at?: string
          height?: number
          id?: string
          is_cover?: boolean
          r2_key?: string
          sort_order?: number
          url?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          body_type: string | null
          brand: string
          cash_price: number
          category: string
          category_label: string
          color: string
          conditions: string[]
          created_at: string
          created_by: string | null
          creator_insights: Json | null
          credit_price: number | null
          credit_price_note: string | null
          document_checklist: Json
          drivetrain: string | null
          engine_cc: number | null
          estimated_annual_tax: number | null
          ev_specs: Json | null
          featured_order: number | null
          fuel_type: string
          highlights: string[]
          id: string
          imperfections: Json
          inspection_summary: Json
          interior_color: string | null
          is_featured: boolean
          location: string
          mechanic_check_allowed: boolean
          mileage_km: number | null
          mileage_label: string
          mileage_verification_source: string | null
          mileage_verified: boolean
          name: string
          offer_badge: string | null
          ownership_hand: number | null
          ownership_type: string | null
          payment_mode: string
          plate_area_code: string | null
          plate_info: string
          plate_odd_even: string | null
          recent_maintenance: string[]
          seat_capacity: number | null
          short_name: string
          slug: string
          sort_order: number
          status: string
          stnk_5yr_expiry_date: string | null
          stnk_block_free: boolean
          tax_expiry_date: string | null
          tax_status: string | null
          trade_in_available: boolean
          transmission: string
          transmission_group: string
          updated_at: string
          usage_history: string | null
          video_walkaround_url: string | null
          vin_engine_matched: boolean
          warranty_info: string | null
          year: string
          year_sort: number
        }
        Insert: {
          body_type?: string | null
          brand: string
          cash_price: number
          category: string
          category_label: string
          color: string
          conditions?: string[]
          created_at?: string
          created_by?: string | null
          creator_insights?: Json | null
          credit_price?: number | null
          credit_price_note?: string | null
          document_checklist?: Json
          drivetrain?: string | null
          engine_cc?: number | null
          estimated_annual_tax?: number | null
          ev_specs?: Json | null
          featured_order?: number | null
          fuel_type?: string
          highlights?: string[]
          id?: string
          imperfections?: Json
          inspection_summary?: Json
          interior_color?: string | null
          is_featured?: boolean
          location?: string
          mechanic_check_allowed?: boolean
          mileage_km?: number | null
          mileage_label: string
          mileage_verification_source?: string | null
          mileage_verified?: boolean
          name: string
          offer_badge?: string | null
          ownership_hand?: number | null
          ownership_type?: string | null
          payment_mode: string
          plate_area_code?: string | null
          plate_info: string
          plate_odd_even?: string | null
          recent_maintenance?: string[]
          seat_capacity?: number | null
          short_name: string
          slug: string
          sort_order?: number
          status?: string
          stnk_5yr_expiry_date?: string | null
          stnk_block_free?: boolean
          tax_expiry_date?: string | null
          tax_status?: string | null
          trade_in_available?: boolean
          transmission: string
          transmission_group: string
          updated_at?: string
          usage_history?: string | null
          video_walkaround_url?: string | null
          vin_engine_matched?: boolean
          warranty_info?: string | null
          year: string
          year_sort: number
        }
        Update: {
          body_type?: string | null
          brand?: string
          cash_price?: number
          category?: string
          category_label?: string
          color?: string
          conditions?: string[]
          created_at?: string
          created_by?: string | null
          creator_insights?: Json | null
          credit_price?: number | null
          credit_price_note?: string | null
          document_checklist?: Json
          drivetrain?: string | null
          engine_cc?: number | null
          estimated_annual_tax?: number | null
          ev_specs?: Json | null
          featured_order?: number | null
          fuel_type?: string
          highlights?: string[]
          id?: string
          imperfections?: Json
          inspection_summary?: Json
          interior_color?: string | null
          is_featured?: boolean
          location?: string
          mechanic_check_allowed?: boolean
          mileage_km?: number | null
          mileage_label?: string
          mileage_verification_source?: string | null
          mileage_verified?: boolean
          name?: string
          offer_badge?: string | null
          ownership_hand?: number | null
          ownership_type?: string | null
          payment_mode?: string
          plate_area_code?: string | null
          plate_info?: string
          plate_odd_even?: string | null
          recent_maintenance?: string[]
          seat_capacity?: number | null
          short_name?: string
          slug?: string
          sort_order?: number
          status?: string
          stnk_5yr_expiry_date?: string | null
          stnk_block_free?: boolean
          tax_expiry_date?: string | null
          tax_status?: string | null
          trade_in_available?: boolean
          transmission?: string
          transmission_group?: string
          updated_at?: string
          usage_history?: string | null
          video_walkaround_url?: string | null
          vin_engine_matched?: boolean
          warranty_info?: string | null
          year?: string
          year_sort?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_contacts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone_display: string
          phone_e164: string
          role: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone_display: string
          phone_e164: string
          role: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone_display?: string
          phone_e164?: string
          role?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      showroom_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      showroom_settings: {
        Row: {
          address: string
          city: string
          hours: string
          id: number
          instagram_handle: string
          instagram_url: string
          logo_url: string
          maps_embed_url: string
          maps_url: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          hours?: string
          id?: number
          instagram_handle?: string
          instagram_url?: string
          logo_url?: string
          maps_embed_url?: string
          maps_url?: string
          name?: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          hours?: string
          id?: number
          instagram_handle?: string
          instagram_url?: string
          logo_url?: string
          maps_embed_url?: string
          maps_url?: string
          name?: string
          updated_at?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
