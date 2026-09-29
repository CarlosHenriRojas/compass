import { SidebarContent } from "@/components/layout/sidebar-content";

export function AppSidebar() {
  return (
    <aside className="hidden h-svh w-[256px] shrink-0 border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block">
      <SidebarContent />
    </aside>
  );
}
