import {
  HomeIcon,
  ImagesIcon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  type LucideIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Key in messages/en/nav.json */
  label: "home" | "templates" | "projects" | "uploads" | "ai" | "settings" | "admin";
  icon: LucideIcon;
  adminOnly?: boolean;
}

/** Only built destinations (AUDIT §5: hide, don't show disabled). Add AI when it ships. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/home", label: "home", icon: HomeIcon },
  { href: "/templates", label: "templates", icon: LayoutTemplateIcon },
  { href: "/projects", label: "projects", icon: LayoutGridIcon },
  { href: "/uploads", label: "uploads", icon: ImagesIcon },
  { href: "/ai", label: "ai", icon: SparklesIcon },
  { href: "/settings", label: "settings", icon: SettingsIcon },
  { href: "/admin", label: "admin", icon: ShieldIcon, adminOnly: true },
];

export const visibleNav = (isAdmin: boolean) => NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
