import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireCurrentProfile } from "@/lib/auth/session";

export default async function ApplicationLayout({ children }: LayoutProps<"/">) {
  const profile = await requireCurrentProfile();

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <AppHeader profile={profile} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
