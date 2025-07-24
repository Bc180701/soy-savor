export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          description: string | null
          display_order: number
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          description?: string | null
          display_order?: number
          id: string
          name: string
          restaurant_id: string
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      day_based_promotions: {
        Row: {
          applicable_categories: string[] | null
          applicable_days: number[]
          applicable_products: string[] | null
          applicable_restaurants: string[] | null
          created_at: string
          description: string
          discount: number
          end_time: string | null
          id: string
          is_active: boolean
          is_percentage: boolean
          restaurant_id: string
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_days: number[]
          applicable_products?: string[] | null
          applicable_restaurants?: string[] | null
          created_at?: string
          description: string
          discount: number
          end_time?: string | null
          id?: string
          is_active?: boolean
          is_percentage?: boolean
          restaurant_id: string
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_days?: number[]
          applicable_products?: string[] | null
          applicable_restaurants?: string[] | null
          created_at?: string
          description?: string
          discount?: number
          end_time?: string | null
          id?: string
          is_active?: boolean
          is_percentage?: boolean
          restaurant_id?: string
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_based_promotions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_locations: {
        Row: {
          city: string
          created_at: string | null
          id: number
          is_active: boolean | null
          postal_code: string
          restaurant_id: string
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          postal_code: string
          restaurant_id: string
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          postal_code?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_locations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          available: boolean
          created_at: string | null
          delivery_fee: number | null
          id: string
          min_order: number | null
          name: string
        }
        Insert: {
          available?: boolean
          created_at?: string | null
          delivery_fee?: number | null
          id?: string
          min_order?: number | null
          name: string
        }
        Update: {
          available?: boolean
          created_at?: string | null
          delivery_fee?: number | null
          id?: string
          min_order?: number | null
          name?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          id: number
          section_data: Json
          section_name: string
          updated_at: string
        }
        Insert: {
          id?: number
          section_data: Json
          section_name: string
          updated_at?: string
        }
        Update: {
          id?: number
          section_data?: Json
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_analytics: {
        Row: {
          created_at: string | null
          date: string
          id: string
          total_orders: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          total_orders?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
          special_instructions?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          allergies: string[] | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          contact_preference: string | null
          created_at: string | null
          customer_notes: string | null
          delivery_address_id: string | null
          delivery_city: string | null
          delivery_fee: number
          delivery_instructions: string | null
          delivery_postal_code: string | null
          delivery_street: string | null
          discount: number | null
          id: string
          order_type: string
          payment_method: string
          payment_status: string
          pickup_time: string | null
          promo_code: string | null
          restaurant_id: string
          scheduled_for: string
          status: string
          stripe_session_id: string | null
          subtotal: number
          tax: number
          tip: number | null
          total: number
          user_id: string | null
        }
        Insert: {
          allergies?: string[] | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          contact_preference?: string | null
          created_at?: string | null
          customer_notes?: string | null
          delivery_address_id?: string | null
          delivery_city?: string | null
          delivery_fee: number
          delivery_instructions?: string | null
          delivery_postal_code?: string | null
          delivery_street?: string | null
          discount?: number | null
          id?: string
          order_type: string
          payment_method: string
          payment_status?: string
          pickup_time?: string | null
          promo_code?: string | null
          restaurant_id: string
          scheduled_for: string
          status?: string
          stripe_session_id?: string | null
          subtotal: number
          tax: number
          tip?: number | null
          total: number
          user_id?: string | null
        }
        Update: {
          allergies?: string[] | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          contact_preference?: string | null
          created_at?: string | null
          customer_notes?: string | null
          delivery_address_id?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_postal_code?: string | null
          delivery_street?: string | null
          discount?: number | null
          id?: string
          order_type?: string
          payment_method?: string
          payment_status?: string
          pickup_time?: string | null
          promo_code?: string | null
          restaurant_id?: string
          scheduled_for?: string
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          tax?: number
          tip?: number | null
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string | null
          provider: string
          provider_payment_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          provider: string
          provider_payment_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          provider?: string
          provider_payment_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      poke_ingredients: {
        Row: {
          created_at: string | null
          id: string
          included: boolean
          ingredient_type: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          included?: boolean
          ingredient_type: string
          name: string
          price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          included?: boolean
          ingredient_type?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      popular_products: {
        Row: {
          created_at: string | null
          date: string
          id: string
          order_count: number | null
          product_id: string
          product_name: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          order_count?: number | null
          product_id: string
          product_name: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          order_count?: number | null
          product_id?: string
          product_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          allergens: string[] | null
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_best_seller: boolean | null
          is_gluten_free: boolean | null
          is_new: boolean | null
          is_spicy: boolean | null
          is_vegetarian: boolean | null
          name: string
          pieces: number | null
          prep_time: number | null
          price: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_best_seller?: boolean | null
          is_gluten_free?: boolean | null
          is_new?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          pieces?: number | null
          prep_time?: number | null
          price: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_best_seller?: boolean | null
          is_gluten_free?: boolean | null
          is_new?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          pieces?: number | null
          prep_time?: number | null
          price?: number
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          loyalty_points: number | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          loyalty_points?: number | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          loyalty_points?: number | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usage: {
        Row: {
          id: string
          promo_code: string
          used_at: string | null
          user_email: string
        }
        Insert: {
          id?: string
          promo_code: string
          used_at?: string | null
          user_email: string
        }
        Update: {
          id?: string
          promo_code?: string
          used_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applicable_categories: string[] | null
          code: string | null
          created_at: string | null
          description: string
          discount: number
          end_date: string
          id: string
          image_url: string | null
          is_one_time_use: boolean | null
          is_percentage: boolean
          min_order: number | null
          restaurant_id: string
          start_date: string
          title: string
        }
        Insert: {
          applicable_categories?: string[] | null
          code?: string | null
          created_at?: string | null
          description: string
          discount: number
          end_date: string
          id?: string
          image_url?: string | null
          is_one_time_use?: boolean | null
          is_percentage?: boolean
          min_order?: number | null
          restaurant_id: string
          start_date: string
          title: string
        }
        Update: {
          applicable_categories?: string[] | null
          code?: string | null
          created_at?: string | null
          description?: string
          discount?: number
          end_date?: string
          id?: string
          image_url?: string | null
          is_one_time_use?: boolean | null
          is_percentage?: boolean
          min_order?: number | null
          restaurant_id?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_closures: {
        Row: {
          closure_date: string
          created_at: string
          end_time: string | null
          id: string
          is_all_day: boolean
          reason: string | null
          restaurant_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          closure_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_all_day?: boolean
          reason?: string | null
          restaurant_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          closure_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_all_day?: boolean
          reason?: string | null
          restaurant_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_closures_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_opening_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string
          restaurant_id: string
          slot_number: number
          updated_at: string
        }
        Insert: {
          close_time?: string
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string
          restaurant_id: string
          slot_number?: number
          updated_at?: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string
          restaurant_id?: string
          slot_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_opening_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          postal_code: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurants_info: {
        Row: {
          address: string
          city: string
          created_at: string
          display_order: number
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          postal_code: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          postal_code: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          postal_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurants_info_hours: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string | null
          restaurant_info_id: string
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          restaurant_info_id: string
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          restaurant_info_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_info_hours_restaurant_info_id_fkey"
            columns: ["restaurant_info_id"]
            isOneToOne: false
            referencedRelation: "restaurants_info"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          order_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sushi_ingredients: {
        Row: {
          created_at: string
          id: string
          included: boolean
          ingredient_type: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          included?: boolean
          ingredient_type?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          included?: boolean
          ingredient_type?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          available: boolean
          created_at: string | null
          id: string
          time: string
        }
        Insert: {
          available?: boolean
          created_at?: string | null
          id?: string
          time: string
        }
        Update: {
          available?: boolean
          created_at?: string | null
          id?: string
          time?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          additional_info: string | null
          city: string
          created_at: string | null
          id: string
          is_default: boolean
          postal_code: string
          street: string
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          city: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          postal_code: string
          street: string
          user_id: string
        }
        Update: {
          additional_info?: string | null
          city?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          postal_code?: string
          street?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_sign_in_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      count_table_rows: {
        Args: { table_name: string }
        Returns: number
      }
      create_admin_user: {
        Args: { admin_email: string; admin_password: string }
        Returns: Json
      }
      get_homepage_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      insert_homepage_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_all_products_status: {
        Args: { flag_name: string; flag_value: boolean }
        Returns: undefined
      }
      update_homepage_data: {
        Args: { section_name: string; section_data: Json }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "client" | "cuisinier" | "livreur" | "administrateur"
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
      user_role: ["client", "cuisinier", "livreur", "administrateur"],
    },
  },
} as const
