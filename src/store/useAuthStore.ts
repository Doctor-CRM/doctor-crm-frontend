import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user?: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (token: string, user?: User) => {
        localStorage.setItem("auth_token", token);
        set({
          token,
          user: user || null,
          isAuthenticated: true,
        });
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "doctor_crm_auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
