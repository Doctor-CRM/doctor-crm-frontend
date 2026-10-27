import type { UserRole } from "../types/auth";

export const getRoleDashboardPath = (role?: UserRole | string): string => {
  if (!role) return "/";
  const normalizedRole = role.toLowerCase().trim();

  switch (normalizedRole) {
    case "doctor":
      return "/doctor";
    case "patient":
      return "/patient";
    case "admin":
      return "/admin";
    case "receptionist":
    case "reception":
      return "/receptionist";
    default:
      return "/";
  }
};

export const formatRoleName = (role?: UserRole | string): string => {
  if (!role) return "User";
  const normalizedRole = role.toLowerCase().trim();
  switch (normalizedRole) {
    case "doctor":
      return "Doctor";
    case "patient":
      return "Patient";
    case "admin":
      return "Admin";
    case "receptionist":
    case "reception":
      return "Receptionist";
    default:
      return role;
  }
};

/**
 * Extract active username reliably from User object, stored auth, or fallback
 */
export const getEffectiveUsername = (
  user?: { username?: string; name?: string; role?: string } | null
): string => {
  if (user?.username && user.username.trim()) {
    return user.username.trim();
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("logged_in_username");
    if (stored && stored.trim()) {
      return stored.trim();
    }
  }
  if (user?.name && user.name.trim()) {
    return user.name.trim();
  }
  return "";
};

/**
 * Safely parse base64 JWT payload in browser environment
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

