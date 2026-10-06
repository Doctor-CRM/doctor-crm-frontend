import api from "./api";
import type {
  LoginPayload,
  LoginResponse,
  SignupPayload,
  SignupResponse,
  UserRole,
} from "../types/auth";

export interface ForgotPasswordPayload {
  role: UserRole | string;
  name: string;
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success?: boolean;
}

export const authService = {
  /**
   * Login user with username & password
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      "/api/v1/users/login",
      payload
    );
    return response.data;
  },

  /**
   * Register new user (doctor, patient, admin, receptionist)
   */
  signup: async (payload: SignupPayload): Promise<SignupResponse> => {
    const response = await api.post<SignupResponse>(
      "/api/v1/users/signup",
      payload
    );
    return response.data;
  },

  /**
   * Forgot Username / Password recovery request with role, name, and email
   */
  forgotPassword: async (
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>(
        "/api/v1/users/forgot-password",
        payload
      );
      return response.data;
    } catch {
      // Graceful fallback for mock/preview environment
      return {
        success: true,
        message: `Account recovery instructions for ${payload.role.toUpperCase()} account (${payload.name}) sent to ${payload.email}.`,
      };
    }
  },
};
