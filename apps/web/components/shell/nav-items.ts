import { HomeIcon, ImagesIcon, type LucideIcon, SettingsIcon, ShieldIcon } from "lucide-react";

export interface NavItem {
  href: string;
  /** Key in messages/en/nav.json */
  label: "home" | "uploads" | "settings" | "admin";
  icon: LucideIcon;
  adminOnly?: boolean;
}

/** Only built destinations (AUDIT §5: hide, don't show disabled). Add Templates/AI when they ship. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/home", label: "home", icon: HomeIcon },
  { href: "/uploads", label: "uploads", icon: ImagesIcon },
  { href: "/settings", label: "settings", icon: SettingsIcon },
  { href: "/admin", label: "admin", icon: ShieldIcon, adminOnly: true },
];

export const visibleNav = (isAdmin: boolean) => NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
