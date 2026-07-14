export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "inactive" | "draft";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
}

export type AppRole = "user" | "admin";
