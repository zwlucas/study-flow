import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Orbit,
  GitBranch,
  NotebookPen,
  BarChart3,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const mainNav: NavItem[] = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/flow", label: "Flow Space", icon: Orbit },
  { href: "/planning", label: "Planning", icon: GitBranch },
  { href: "/notes", label: "Notas", icon: NotebookPen },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/ai", label: "AI Chat", icon: Sparkles },
];
