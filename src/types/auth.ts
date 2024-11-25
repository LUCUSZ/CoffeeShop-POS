export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}