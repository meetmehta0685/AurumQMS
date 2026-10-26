import type { UserRole } from "@/types";

// Public signup may only create these roles; staff roles are assigned by an
// admin. The database trigger `handle_new_user` enforces the same rule.
export const SELF_SERVICE_ROLES = ["patient", "guest"] as const;

export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/admin",
  guest: "/guest",
  staff: "/staff",
  lab: "/lab",
  pharma: "/pharma",
};

const PROTECTED_ROUTE_RULES: Array<{
  prefix: string;
  allowedRoles: UserRole[];
}> = [
  { prefix: "/admin", allowedRoles: ["admin"] },
  { prefix: "/doctor", allowedRoles: ["doctor"] },
  { prefix: "/patient", allowedRoles: ["patient"] },
  { prefix: "/lab", allowedRoles: ["lab"] },
  { prefix: "/pharma", allowedRoles: ["pharma"] },
  { prefix: "/staff", allowedRoles: ["admin", "staff"] },
  { prefix: "/guest", allowedRoles: ["patient", "guest"] },
];

export function resolveRoleHomeRoute(role: string | null | undefined) {
  if (role && role in ROLE_HOME_ROUTES) {
    return ROLE_HOME_ROUTES[role as UserRole];
  }

  return ROLE_HOME_ROUTES.patient;
}

export function getAllowedRolesForPath(pathname: string) {
  for (const rule of PROTECTED_ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.allowedRoles;
    }
  }

  return null;
}
