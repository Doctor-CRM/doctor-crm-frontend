import { useMutation } from "@tanstack/react-query";
import { authService } from "../service/authService";
import { useAuthStore } from "../store/useAuthStore";
import { decodeJwtPayload } from "../utils/roleUtils";
import type { LoginPayload, SignupPayload, User } from "../types/auth";

export const useLoginMutation = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data, variables) => {
      const token = data.token;
      const jwtPayload = token ? decodeJwtPayload(token) : null;
      const rawUser: Partial<User> = data.user || data.data || {};
      const anyData = data as unknown as Record<string, any>;

      const resolvedUsername =
        rawUser.username ||
        anyData.username ||
        jwtPayload?.username ||
        jwtPayload?.user?.username ||
        jwtPayload?.preferred_username ||
        jwtPayload?.sub ||
        variables.username.trim();

      const resolvedRole =
        rawUser.role ||
        anyData.role ||
        jwtPayload?.role ||
        jwtPayload?.user?.role ||
        jwtPayload?.roles?.[0] ||
        "";

      const resolvedName =
        rawUser.name ||
        anyData.name ||
        jwtPayload?.name ||
        jwtPayload?.user?.name ||
        resolvedUsername;

      const userObj: User = {
        username: resolvedUsername,
        role: resolvedRole,
        name: resolvedName,
        email: rawUser.email || anyData.email || jwtPayload?.email,
        id: rawUser.id || anyData.id || jwtPayload?.id || jwtPayload?.userId,
      };

      if (token) {
        setAuth(token, userObj);
      }
    },
  });
};

export const useSignupMutation = () => {
  return useMutation({
    mutationFn: (payload: SignupPayload) => authService.signup(payload),
  });
};
