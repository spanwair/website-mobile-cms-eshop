// Auto-generated Supabase types — run `supabase gen types` to update.
// Replace this stub with your generated types after DB setup.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
        };
      };
      items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: "active" | "inactive" | "draft";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          status?: "active" | "inactive" | "draft";
          created_by: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: "active" | "inactive" | "draft";
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "user" | "admin";
    };
  };
};
