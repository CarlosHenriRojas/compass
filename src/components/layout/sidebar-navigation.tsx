"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavigationProps = {
  onNavigate?: () => void;
};

function isCurrentRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavigation({ onNavigate }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1.5">
      {mainNavigation.map((item) => {
        const isActive = isCurrentRoute(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex h-11 items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-sidebar-foreground/75 transition-[color,background-color,border-color] duration-200 hover:bg-foreground/[0.035] hover:text-sidebar-accent-foreground",
              isActive &&
                "border-compass-purple-light/25 bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:inset-y-2.5 before:-left-px before:w-0.5 before:rounded-full before:bg-sidebar-primary",
            )}
          >
            <Icon
              className={cn(
                "size-[18px] text-sidebar-foreground/60 transition-colors duration-200 group-hover:text-sidebar-accent-foreground",
                isActive && "text-sidebar-primary",
              )}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
