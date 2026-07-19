export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          company: string | null
          country_code: string
          created_at: string
          customer_id: string
          first_name: string
          id: string
          is_default: boolean
          last_name: string
          line1: string
          line2: string | null
          postal_code: string
          state: string | null
          type: string
          updated_at: string
        }
        Insert: {
          city: string
          company?: string | null
          country_code?: string
          created_at?: string
          customer_id: string
          first_name: string
          id?: string
          is_default?: boolean
          last_name: string
          line1: string
          line2?: string | null
          postal_code: string
          state?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          city?: string
          company?: string | null
          country_code?: string
          created_at?: string
          customer_id?: string
          first_name?: string
          id?: string
          is_default?: boolean
          last_name?: string
          line1?: string
          line2?: string | null
          postal_code?: string
          state?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          device_info: string | null
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          party_id: string | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          party_id?: string | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_info?: string | null
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          party_id?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          party_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          party_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          party_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          unit_price: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          unit_price: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          abandoned_at: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          id: string
          notes: string | null
          party_id: string
          recovery_sent_at: string | null
          session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          party_id: string
          recovery_sent_at?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          party_id?: string
          recovery_sent_at?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          name: string
          parent_id: string | null
          party_id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name: string
          parent_id?: string | null
          party_id: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name?: string
          parent_id?: string | null
          party_id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_rule_id: string
          id: string
          is_active: boolean
          max_uses: number | null
          party_id: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_rule_id: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          party_id: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_rule_id?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          party_id?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_discount_rule_id_fkey"
            columns: ["discount_rule_id"]
            isOneToOne: false
            referencedRelation: "discount_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          customer_group: string
          date_of_birth: string | null
          email: string
          first_name: string
          gdpr_consent: boolean
          gdpr_consent_at: string | null
          gdpr_consent_ip: unknown
          gender: string | null
          id: string
          is_active: boolean
          last_name: string
          lifetime_value: number
          loyalty_points: number
          marketing_opt_in: boolean
          notes: string | null
          party_id: string
          phone: string | null
          preferred_language: string
          tags: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_group?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          gdpr_consent?: boolean
          gdpr_consent_at?: string | null
          gdpr_consent_ip?: unknown
          gender?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          lifetime_value?: number
          loyalty_points?: number
          marketing_opt_in?: boolean
          notes?: string | null
          party_id: string
          phone?: string | null
          preferred_language?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_group?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          gdpr_consent?: boolean
          gdpr_consent_at?: string | null
          gdpr_consent_ip?: unknown
          gender?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          lifetime_value?: number
          loyalty_points?: number
          marketing_opt_in?: boolean
          notes?: string | null
          party_id?: string
          phone?: string | null
          preferred_language?: string
          tags?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_rules: {
        Row: {
          applies_to: string
          applies_to_ids: string[]
          created_at: string
          customer_group: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          min_order_amount: number | null
          min_quantity: number | null
          name: string
          party_id: string
          starts_at: string | null
          type: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
          value: number
        }
        Insert: {
          applies_to?: string
          applies_to_ids?: string[]
          created_at?: string
          customer_group?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          min_quantity?: number | null
          name: string
          party_id: string
          starts_at?: string | null
          type: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value: number
        }
        Update: {
          applies_to?: string
          applies_to_ids?: string[]
          created_at?: string
          customer_group?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          min_quantity?: number | null
          name?: string
          party_id?: string
          starts_at?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_rules_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          is_low_stock: boolean | null
          low_stock_threshold: number
          party_id: string
          product_id: string
          qty_incoming: number
          qty_on_hand: number
          qty_reserved: number
          track_inventory: boolean
          updated_at: string
          variant_id: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_low_stock?: boolean | null
          low_stock_threshold?: number
          party_id: string
          product_id: string
          qty_incoming?: number
          qty_on_hand?: number
          qty_reserved?: number
          track_inventory?: boolean
          updated_at?: string
          variant_id?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_low_stock?: boolean | null
          low_stock_threshold?: number
          party_id?: string
          product_id?: string
          qty_incoming?: number
          qty_on_hand?: number
          qty_reserved?: number
          track_inventory?: boolean
          updated_at?: string
          variant_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["item_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string
          customer_id: string
          id: string
          note: string | null
          order_id: string | null
          party_id: string
          points: number
          type: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          customer_id: string
          id?: string
          note?: string | null
          order_id?: string | null
          party_id: string
          points: number
          type: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          order_id?: string | null
          party_id?: string
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json
          party_id: string | null
          title: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          party_id?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          party_id?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          order_id: string
          product_id: string
          quantity: number
          sku: string | null
          tax_amount: number
          title: string
          total_price: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          sku?: string | null
          tax_amount?: number
          title: string
          total_price: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          sku?: string | null
          tax_amount?: number
          title?: string
          total_price?: number
          unit_price?: number
          variant_id?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address_id: string | null
          created_at: string
          currency: string
          customer_id: string
          delivered_at: string | null
          discount_amount: number
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          party_id: string
          payment_status: string
          shipped_at: string | null
          shipping_address_id: string | null
          shipping_amount: number
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          billing_address_id?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          delivered_at?: string | null
          discount_amount?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          party_id: string
          payment_status?: string
          shipped_at?: string | null
          shipping_address_id?: string | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          billing_address_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          delivered_at?: string | null
          discount_amount?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          party_id?: string
          payment_status?: string
          shipped_at?: string | null
          shipping_address_id?: string | null
          shipping_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          billing_email: string | null
          company_name: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          settings: Json
          slug: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          billing_email?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          settings?: Json
          slug: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          billing_email?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          settings?: Json
          slug?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          id: string
          price: number
          price_list_id: string
          product_id: string
          variant_id: string | null
        }
        Insert: {
          id?: string
          price: number
          price_list_id: string
          product_id: string
          variant_id?: string | null
        }
        Update: {
          id?: string
          price?: number
          price_list_id?: string
          product_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          party_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          party_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          party_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_email: string
          author_name: string
          body: string | null
          created_at: string
          customer_id: string | null
          helpful_count: number
          id: string
          image_urls: string[]
          is_verified: boolean
          order_id: string | null
          party_id: string
          product_id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_email: string
          author_name: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          helpful_count?: number
          id?: string
          image_urls?: string[]
          is_verified?: boolean
          order_id?: string | null
          party_id: string
          product_id: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_email?: string
          author_name?: string
          body?: string | null
          created_at?: string
          customer_id?: string | null
          helpful_count?: number
          id?: string
          image_urls?: string[]
          is_verified?: boolean
          order_id?: string | null
          party_id?: string
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          product_id: string
          tag: string
        }
        Insert: {
          product_id: string
          tag: string
        }
        Update: {
          product_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          barcode: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price: number | null
          product_id: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json
          barcode?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          product_id: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json
          barcode?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          created_at: string
          description: string | null
          description_rich: Json | null
          discount_price: number | null
          id: string
          is_featured: boolean
          is_visible: boolean
          party_id: string
          price: number
          rating_avg: number
          review_count: number
          seo_description: string | null
          seo_title: string | null
          sku: string | null
          slug: string
          status: string
          tax_rate: number
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string | null
          description_rich?: Json | null
          discount_price?: number | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          party_id: string
          price?: number
          rating_avg?: number
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug: string
          status?: string
          tax_rate?: number
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          created_at?: string
          description?: string | null
          description_rich?: Json | null
          discount_price?: number | null
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          party_id?: string
          price?: number
          rating_avg?: number
          review_count?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug?: string
          status?: string
          tax_rate?: number
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_assigned_by: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          google_id: string | null
          id: string
          is_active: boolean
          lang: string
          last_login_at: string | null
          phone: string | null
          role: number
          updated_at: string
        }
        Insert: {
          admin_assigned_by?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          google_id?: string | null
          id: string
          is_active?: boolean
          lang?: string
          last_login_at?: string | null
          phone?: string | null
          role?: number
          updated_at?: string
        }
        Update: {
          admin_assigned_by?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          google_id?: string | null
          id?: string
          is_active?: boolean
          lang?: string
          last_login_at?: string | null
          phone?: string | null
          role?: number
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          banner_image_url: string | null
          created_at: string
          description: string | null
          discount_rule_id: string
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          party_id: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          discount_rule_id: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          party_id: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          description?: string | null
          discount_rule_id?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          party_id?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_discount_rule_id_fkey"
            columns: ["discount_rule_id"]
            isOneToOne: false
            referencedRelation: "discount_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          condition: string | null
          created_at: string
          id: string
          order_item_id: string
          quantity: number
          restock: boolean
          return_request_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          id?: string
          order_item_id: string
          quantity?: number
          restock?: boolean
          return_request_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          id?: string
          order_item_id?: string
          quantity?: number
          restock?: boolean
          return_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          id: string
          notes: string | null
          order_id: string
          party_id: string
          reason: string
          received_at: string | null
          refund_amount: number | null
          refund_method: string | null
          resolution: string | null
          return_number: string
          shipping_label_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          id?: string
          notes?: string | null
          order_id: string
          party_id: string
          reason: string
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          resolution?: string | null
          return_number: string
          shipping_label_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          party_id?: string
          reason?: string
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          resolution?: string | null
          return_number?: string
          shipping_label_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          party_id: string
          permissions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          party_id: string
          permissions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          party_id?: string
          permissions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          note: string | null
          party_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          note?: string | null
          party_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          note?: string | null
          party_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_party_roles: {
        Row: {
          invited_by: string | null
          joined_at: string
          party_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          invited_by?: string | null
          joined_at?: string
          party_id: string
          role_id: string
          user_id: string
        }
        Update: {
          invited_by?: string | null
          joined_at?: string
          party_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_party_roles_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_party_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: Json
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          party_id: string
          updated_at: string
        }
        Insert: {
          address?: Json
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          party_id: string
          updated_at?: string
        }
        Update: {
          address?: Json
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          party_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          added_at: string
          id: string
          notified_at: string | null
          product_id: string
          variant_id: string | null
          wishlist_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          notified_at?: string | null
          product_id: string
          variant_id?: string | null
          wishlist_id: string
        }
        Update: {
          added_at?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          variant_id?: string | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          party_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          party_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          party_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      inventory_alerts: {
        Row: {
          created_at: string | null
          id: string | null
          low_stock_threshold: number | null
          party_id: string | null
          product_id: string | null
          product_title: string | null
          qty_available: number | null
          qty_incoming: number | null
          qty_on_hand: number | null
          qty_reserved: number | null
          track_inventory: boolean | null
          updated_at: string | null
          variant_id: string | null
          variant_name: string | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      audit_log: {
        Args: {
          p_action: string
          p_new_val?: Json
          p_old_val?: Json
          p_party_id: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      can_access_admin: { Args: never; Returns: boolean }
      get_my_role: { Args: never; Returns: number }
      get_user_permissions: {
        Args: { p_party_id: string; p_user_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      user_has_permission: {
        Args: { p_party_id: string; p_permission: number; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      item_status: "draft" | "active" | "inactive"
      notification_type:
        | "low_inventory"
        | "new_order"
        | "failed_payment"
        | "new_registration"
        | "system_alert"
        | "role_invitation"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      item_status: ["draft", "active", "inactive"],
      notification_type: [
        "low_inventory",
        "new_order",
        "failed_payment",
        "new_registration",
        "system_alert",
        "role_invitation",
      ],
    },
  },
} as const

