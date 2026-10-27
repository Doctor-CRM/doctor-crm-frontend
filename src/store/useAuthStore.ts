import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user?: User) => void;
  updateUsername: (newUsername: string) => void;
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
        if (user?.username) {
          localStorage.setItem("logged_in_username", user.username);
        }
        set({
          token,
          user: user || null,
          isAuthenticated: true,
        });
      },
      updateUsername: (newUsername: string) => {
        const trimmed = newUsername.trim();
        localStorage.setItem("logged_in_username", trimmed);
        set((state) => ({
          user: state.user
            ? { ...state.user, username: trimmed }
            : { username: trimmed },
        }));
      },
      logout: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("logged_in_username");
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
