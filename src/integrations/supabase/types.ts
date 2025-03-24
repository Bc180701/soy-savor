export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          description: string | null
          display_order: number
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          display_order?: number
          id: string
          name: string
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
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
          created_at: string | null
          delivery_address_id: string | null
          delivery_fee: number
          delivery_instructions: string | null
          discount: number | null
          id: string
          order_type: string
          payment_method: string
          payment_status: string
          promo_code: string | null
          scheduled_for: string
          status: string
          subtotal: number
          tax: number
          tip: number | null
          total: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address_id?: string | null
          delivery_fee: number
          delivery_instructions?: string | null
          discount?: number | null
          id?: string
          order_type: string
          payment_method: string
          payment_status?: string
          promo_code?: string | null
          scheduled_for: string
          status?: string
          subtotal: number
          tax: number
          tip?: number | null
          total: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address_id?: string | null
          delivery_fee?: number
          delivery_instructions?: string | null
          discount?: number | null
          id?: string
          order_type?: string
          payment_method?: string
          payment_status?: string
          promo_code?: string | null
          scheduled_for?: string
          status?: string
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
          is_new: boolean | null
          is_spicy: boolean | null
          is_vegetarian: boolean | null
          name: string
          pieces: number | null
          price: number
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
          is_new?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          pieces?: number | null
          price: number
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
          is_new?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          pieces?: number | null
          price?: number
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
          is_percentage: boolean
          min_order: number | null
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
          is_percentage?: boolean
          min_order?: number | null
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
          is_percentage?: boolean
          min_order?: number | null
          start_date?: string
          title?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
