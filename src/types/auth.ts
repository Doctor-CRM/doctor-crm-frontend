export type UserRole = "doctor" | "patient" | "admin" | "receptionist";

export interface User {
  id?: string;
  name?: string;
  username: string;
  email?: string;
  role?: UserRole | string;
  createdAt?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole | string;
}

export interface LoginResponse {
  token: string;
  user?: User;
  data?: User; // Backend fallback key
  message?: string;
}

export interface SignupResponse {
  username: string;
  message?: string;
  user?: User;
}

export interface ApiErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}
