export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: number;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          google_id: string | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: number;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          google_id?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: number;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          google_id?: string | null;
          is_active?: boolean;
          last_login_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["item_status"];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["item_status"];
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["item_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      parties: {
        Row: {
          id: string;
          name: string;
          slug: string;
          company_name: string | null;
          vat_number: string | null;
          billing_email: string | null;
          logo_url: string | null;
          settings: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          company_name?: string | null;
          vat_number?: string | null;
          billing_email?: string | null;
          logo_url?: string | null;
          settings?: Record<string, unknown>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          company_name?: string | null;
          vat_number?: string | null;
          billing_email?: string | null;
          logo_url?: string | null;
          settings?: Record<string, unknown>;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          permissions: number;
          is_system: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          permissions?: number;
          is_system?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          permissions?: number;
          is_system?: boolean;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      user_party_roles: {
        Row: {
          user_id: string;
          party_id: string;
          role_id: string;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          user_id: string;
          party_id: string;
          role_id: string;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          user_id?: string;
          party_id?: string;
          role_id?: string;
          invited_by?: string | null;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_party_roles_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_party_roles_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          action: string;
          table_name: string;
          record_id: string | null;
          party_id: string | null;
          user_id: string | null;
          ip_address: string | null;
          device_info: string | null;
          old_value: unknown;
          new_value: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          table_name: string;
          record_id?: string | null;
          party_id?: string | null;
          user_id?: string | null;
          ip_address?: string | null;
          device_info?: string | null;
          old_value?: unknown;
          new_value?: unknown;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_logs_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          party_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string | null;
          body: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          party_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title?: string | null;
          body?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string | null;
          body?: string | null;
          metadata?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      user_notifications: {
        Row: {
          user_id: string;
          notification_id: string;
          read_at: string | null;
        };
        Insert: {
          user_id: string;
          notification_id: string;
          read_at?: string | null;
        };
        Update: {
          user_id?: string;
          notification_id?: string;
          read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey";
            columns: ["notification_id"];
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          }
        ];
      };
      brands: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brands_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          party_id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          icon: string | null;
          image_url: string | null;
          seo_title: string | null;
          seo_description: string | null;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          icon?: string | null;
          image_url?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          icon?: string | null;
          image_url?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          party_id: string;
          brand_id: string | null;
          title: string;
          slug: string;
          sku: string | null;
          barcode: string | null;
          description: string | null;
          description_rich: unknown;
          seo_title: string | null;
          seo_description: string | null;
          price: number;
          discount_price: number | null;
          tax_rate: number;
          weight: number | null;
          status: "draft" | "active" | "inactive";
          is_featured: boolean;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          brand_id?: string | null;
          title: string;
          slug: string;
          sku?: string | null;
          barcode?: string | null;
          description?: string | null;
          description_rich?: unknown;
          seo_title?: string | null;
          seo_description?: string | null;
          price?: number;
          discount_price?: number | null;
          tax_rate?: number;
          weight?: number | null;
          status?: "draft" | "active" | "inactive";
          is_featured?: boolean;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          brand_id?: string | null;
          title?: string;
          slug?: string;
          sku?: string | null;
          barcode?: string | null;
          description?: string | null;
          description_rich?: unknown;
          seo_title?: string | null;
          seo_description?: string | null;
          price?: number;
          discount_price?: number | null;
          tax_rate?: number;
          weight?: number | null;
          status?: "draft" | "active" | "inactive";
          is_featured?: boolean;
          is_visible?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            referencedRelation: "brands";
            referencedColumns: ["id"];
          }
        ];
      };
      product_categories: {
        Row: { product_id: string; category_id: string };
        Insert: { product_id: string; category_id: string };
        Update: { product_id?: string; category_id?: string };
        Relationships: [
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_tags: {
        Row: { product_id: string; tag: string };
        Insert: { product_id: string; tag: string };
        Update: { product_id?: string; tag?: string };
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt?: string | null;
          sort_order?: number;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          barcode: string | null;
          price: number | null;
          attributes: Record<string, string>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string | null;
          barcode?: string | null;
          price?: number | null;
          attributes?: Record<string, string>;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          sku?: string | null;
          barcode?: string | null;
          price?: number | null;
          attributes?: Record<string, string>;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          party_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          user_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          type: "shipping" | "billing";
          first_name: string;
          last_name: string;
          company: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string | null;
          postal_code: string;
          country_code: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          type?: "shipping" | "billing";
          first_name: string;
          last_name: string;
          company?: string | null;
          line1: string;
          line2?: string | null;
          city: string;
          state?: string | null;
          postal_code: string;
          country_code?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          type?: "shipping" | "billing";
          first_name?: string;
          last_name?: string;
          company?: string | null;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string | null;
          postal_code?: string;
          country_code?: string;
          is_default?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          party_id: string;
          customer_id: string;
          order_number: string;
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status: "unpaid" | "paid" | "partially_paid" | "refunded" | "failed";
          shipping_address_id: string | null;
          billing_address_id: string | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          shipping_amount: number;
          total_amount: number;
          currency: string;
          notes: string | null;
          internal_notes: string | null;
          tracking_number: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          customer_id: string;
          order_number?: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status?: "unpaid" | "paid" | "partially_paid" | "refunded" | "failed";
          shipping_address_id?: string | null;
          billing_address_id?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          total_amount?: number;
          currency?: string;
          notes?: string | null;
          internal_notes?: string | null;
          tracking_number?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          customer_id?: string;
          order_number?: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          payment_status?: "unpaid" | "paid" | "partially_paid" | "refunded" | "failed";
          shipping_address_id?: string | null;
          billing_address_id?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          total_amount?: number;
          currency?: string;
          notes?: string | null;
          internal_notes?: string | null;
          tracking_number?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          title: string;
          sku: string | null;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          tax_amount: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          title: string;
          sku?: string | null;
          quantity?: number;
          unit_price: number;
          discount_amount?: number;
          tax_amount?: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          variant_id?: string | null;
          title?: string;
          sku?: string | null;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      price_lists: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          currency: string;
          is_default: boolean;
          valid_from: string | null;
          valid_to: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          currency?: string;
          is_default?: boolean;
          valid_from?: string | null;
          valid_to?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          currency?: string;
          is_default?: boolean;
          valid_from?: string | null;
          valid_to?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "price_lists_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      price_list_items: {
        Row: {
          id: string;
          price_list_id: string;
          product_id: string;
          variant_id: string | null;
          price: number;
        };
        Insert: {
          id?: string;
          price_list_id: string;
          product_id: string;
          variant_id?: string | null;
          price: number;
        };
        Update: {
          id?: string;
          price_list_id?: string;
          product_id?: string;
          variant_id?: string | null;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey";
            columns: ["price_list_id"];
            referencedRelation: "price_lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      discount_rules: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
          value: number;
          min_order_amount: number | null;
          min_quantity: number | null;
          applies_to: string;
          applies_to_ids: string[];
          customer_group: string | null;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          usage_limit: number | null;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
          value: number;
          min_order_amount?: number | null;
          min_quantity?: number | null;
          applies_to?: string;
          applies_to_ids?: string[];
          customer_group?: string | null;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          type?: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
          value?: number;
          min_order_amount?: number | null;
          min_quantity?: number | null;
          applies_to?: string;
          applies_to_ids?: string[];
          customer_group?: string | null;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discount_rules_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      coupons: {
        Row: {
          id: string;
          party_id: string;
          code: string;
          discount_rule_id: string;
          max_uses: number | null;
          uses_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          code: string;
          discount_rule_id: string;
          max_uses?: number | null;
          uses_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          code?: string;
          discount_rule_id?: string;
          max_uses?: number | null;
          uses_count?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coupons_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coupons_discount_rule_id_fkey";
            columns: ["discount_rule_id"];
            referencedRelation: "discount_rules";
            referencedColumns: ["id"];
          }
        ];
      };
      promotions: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          description: string | null;
          banner_image_url: string | null;
          discount_rule_id: string;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          description?: string | null;
          banner_image_url?: string | null;
          discount_rule_id: string;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          description?: string | null;
          banner_image_url?: string | null;
          discount_rule_id?: string;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotions_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotions_discount_rule_id_fkey";
            columns: ["discount_rule_id"];
            referencedRelation: "discount_rules";
            referencedColumns: ["id"];
          }
        ];
      };
      warehouses: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          code: string;
          address: Record<string, string>;
          is_active: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          code: string;
          address?: Record<string, string>;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          code?: string;
          address?: Record<string, string>;
          is_active?: boolean;
          is_default?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouses_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          party_id: string;
          product_id: string;
          variant_id: string | null;
          warehouse_id: string;
          qty_on_hand: number;
          qty_reserved: number;
          qty_incoming: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          product_id: string;
          variant_id?: string | null;
          warehouse_id: string;
          qty_on_hand?: number;
          qty_reserved?: number;
          qty_incoming?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          product_id?: string;
          variant_id?: string | null;
          warehouse_id?: string;
          qty_on_hand?: number;
          qty_reserved?: number;
          qty_incoming?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_warehouse_id_fkey";
            columns: ["warehouse_id"];
            referencedRelation: "warehouses";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          party_id: string;
          type: "purchase" | "sale" | "adjustment" | "transfer" | "return" | "damage";
          quantity: number;
          reference_type: string | null;
          reference_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          party_id: string;
          type: "purchase" | "sale" | "adjustment" | "transfer" | "return" | "damage";
          quantity: number;
          reference_type?: string | null;
          reference_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_party_id_fkey";
            columns: ["party_id"];
            referencedRelation: "parties";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      inventory_alerts: {
        Row: {
          id: string;
          party_id: string;
          product_id: string;
          variant_id: string | null;
          warehouse_id: string;
          qty_on_hand: number;
          qty_reserved: number;
          qty_incoming: number;
          qty_available: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          created_at: string;
          updated_at: string;
          product_title: string;
          variant_name: string | null;
          warehouse_name: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_user_permissions: {
        Args: { p_user_id: string; p_party_id: string };
        Returns: number;
      };
      user_has_permission: {
        Args: { p_user_id: string; p_party_id: string; p_permission: number };
        Returns: boolean;
      };
      audit_log: {
        Args: {
          p_action: string;
          p_table_name: string;
          p_record_id: string;
          p_party_id: string;
          p_old_val?: unknown;
          p_new_val?: unknown;
        };
        Returns: void;
      };
    };
    Enums: {
      item_status: "draft" | "active" | "inactive";
      notification_type:
        | "low_inventory"
        | "new_order"
        | "failed_payment"
        | "new_registration"
        | "system_alert"
        | "role_invitation";
    };
    CompositeTypes: Record<string, never>;
  };
};
