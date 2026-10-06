import { useMutation } from "@tanstack/react-query";
import { authService } from "../service/authService";
import { useAuthStore } from "../store/useAuthStore";
import type { LoginPayload, SignupPayload } from "../types/auth";

export const useLoginMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      const token = data.token;
      const user = data.user || data.data;
      if (token) {
        setAuth(token, user);
      }
    },
  });
};

export const useSignupMutation = () => {
  return useMutation({
    mutationFn: (payload: SignupPayload) => authService.signup(payload),
  });
};
