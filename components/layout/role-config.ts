import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  BellRing,
  Building2,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileCheck2,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Pill,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { ROLE_HOME_ROUTES } from "@/lib/auth/roles";
import type { UserRole } from "@/types";

export type Suite = "care" | "stay";

export type RoleNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type RoleMeta = {
  label: string;
  shortLabel: string;
  suite: Suite;
  suiteLabel: string;
  description: string;
  icon: LucideIcon;
  home: string;
  nav: RoleNavItem[];
};

export const suiteMeta = {
  care: {
    label: "Care Operations",
    description: "Clinical work, queue flow, and patient continuity",
    classes: {
      text: "text-care",
      soft: "bg-care/10 text-care",
      border: "border-care/30",
      solid: "bg-care text-care-foreground",
    },
  },
  stay: {
    label: "Stay Operations",
    description: "Guest experience, rooms, and service flow",
    classes: {
      text: "text-stay",
      soft: "bg-stay/10 text-stay-foreground",
      border: "border-stay/30",
      solid: "bg-stay text-stay-foreground",
    },
  },
} as const;

const careNav = {
  overview: { label: "Overview", href: "/patient", icon: LayoutDashboard },
  appointments: {
    label: "Appointments",
    href: "/patient/appointments",
    icon: CalendarDays,
  },
  queue: { label: "Queue", href: "/patient/queue", icon: ListChecks },
  records: { label: "Records", href: "/patient/records", icon: FileText },
  laboratory: {
    label: "Laboratory",
    href: "/patient/laboratory",
    icon: FlaskConical,
  },
  pharmacy: { label: "Pharmacy", href: "/patient/pharma", icon: Pill },
  discharge: {
    label: "Discharge",
    href: "/patient/discharge",
    icon: FileCheck2,
  },
} as const;

export const roleMeta: Record<UserRole, RoleMeta> = {
  patient: {
    label: "Patient workspace",
    shortLabel: "Patient",
    suite: "care",
    suiteLabel: suiteMeta.care.label,
    description: "Your care plan, appointments, and health record",
    icon: HeartPulse,
    home: ROLE_HOME_ROUTES.patient,
    nav: [
      careNav.overview,
      careNav.appointments,
      careNav.queue,
      careNav.records,
      careNav.laboratory,
      careNav.pharmacy,
      careNav.discharge,
    ],
  },
  doctor: {
    label: "Doctor workspace",
    shortLabel: "Doctor",
    suite: "care",
    suiteLabel: suiteMeta.care.label,
    description: "Your clinical schedule, queue, and care actions",
    icon: Stethoscope,
    home: ROLE_HOME_ROUTES.doctor,
    nav: [
      { label: "Overview", href: "/doctor", icon: LayoutDashboard },
      { label: "Queue", href: "/doctor/queue", icon: ListChecks },
      { label: "Schedule", href: "/doctor/schedule", icon: CalendarDays },
      { label: "Laboratory", href: "/doctor/laboratory", icon: FlaskConical },
      { label: "Pharmacy", href: "/doctor/pharma", icon: Pill },
      { label: "Discharge", href: "/doctor/discharge", icon: FileCheck2 },
    ],
  },
  admin: {
    label: "Admin workspace",
    shortLabel: "Admin",
    suite: "care",
    suiteLabel: suiteMeta.care.label,
    description: "System-wide visibility across care operations",
    icon: ShieldCheck,
    home: ROLE_HOME_ROUTES.admin,
    nav: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
      { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
      { label: "Departments", href: "/admin/departments", icon: Building2 },
      { label: "Laboratory", href: "/admin/laboratory", icon: FlaskConical },
      { label: "Pharmacy", href: "/admin/pharma", icon: Pill },
      { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      { label: "Discharge", href: "/admin/discharge", icon: FileCheck2 },
    ],
  },
  lab: {
    label: "Laboratory workspace",
    shortLabel: "Lab",
    suite: "care",
    suiteLabel: suiteMeta.care.label,
    description: "Diagnostic orders, reports, and verification",
    icon: FlaskConical,
    home: ROLE_HOME_ROUTES.lab,
    nav: [
      { label: "Overview", href: "/lab", icon: LayoutDashboard },
      { label: "Orders", href: "/lab#orders", icon: ClipboardList },
      { label: "Reports", href: "/lab#reports", icon: FileCheck2 },
    ],
  },
  pharma: {
    label: "Pharmacy workspace",
    shortLabel: "Pharma",
    suite: "care",
    suiteLabel: suiteMeta.care.label,
    description: "Prescription fulfillment and medication records",
    icon: Pill,
    home: ROLE_HOME_ROUTES.pharma,
    nav: [
      { label: "Overview", href: "/pharma", icon: LayoutDashboard },
      { label: "Dispenses", href: "/pharma#dispenses", icon: ClipboardList },
      { label: "Prescriptions", href: "/pharma#prescriptions", icon: FileText },
    ],
  },
  guest: {
    label: "Guest workspace",
    shortLabel: "Guest",
    suite: "stay",
    suiteLabel: suiteMeta.stay.label,
    description: "Your reservation, preferences, and requests",
    icon: BellRing,
    home: ROLE_HOME_ROUTES.guest,
    nav: [
      { label: "Stay overview", href: "/guest", icon: LayoutDashboard },
      { label: "Reservation", href: "/guest#reservation", icon: CalendarDays },
      { label: "Requests", href: "/guest#requests", icon: BellRing },
    ],
  },
  staff: {
    label: "Staff workspace",
    shortLabel: "Staff",
    suite: "stay",
    suiteLabel: suiteMeta.stay.label,
    description: "Room readiness, arrivals, and guest service flow",
    icon: BedDouble,
    home: ROLE_HOME_ROUTES.staff,
    nav: [
      { label: "Overview", href: "/staff", icon: LayoutDashboard },
      { label: "Room readiness", href: "/staff#rooms", icon: BedDouble },
      { label: "Arrivals", href: "/staff#arrivals", icon: UsersRound },
      { label: "Assignments", href: "/staff#assignments", icon: ScanLine },
    ],
  },
};

export function getRoleFromPathname(pathname: string): UserRole {
  const segment = pathname.split("/")[1] as UserRole | undefined;
  return segment && segment in roleMeta ? segment : "patient";
}

export function isNavItemActive(pathname: string, href: string) {
  const [path] = href.split("#");
  const rootPath = `/${pathname.split("/")[1]}`;
  return path === pathname || (path !== rootPath && pathname.startsWith(`${path}/`));
}
