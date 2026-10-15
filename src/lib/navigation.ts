import {
  CircleAlert,
  ClipboardCheck,
  LayoutDashboard,
  RefreshCw,
  Settings,
  UsersRound,
} from "lucide-react";

export const mainNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/clients", icon: UsersRound },
  { label: "Tarefas", href: "/tasks", icon: ClipboardCheck },
  { label: "Atualizações", href: "/updates", icon: RefreshCw },
  { label: "Pendências", href: "/pending", icon: CircleAlert },
  { label: "Configurações", href: "/settings", icon: Settings },
] as const;
