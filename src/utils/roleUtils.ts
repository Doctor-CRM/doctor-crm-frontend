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
