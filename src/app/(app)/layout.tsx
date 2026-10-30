import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { UserRoleProvider } from "@/lib/user-role-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserRoleProvider>
      <div className="flex h-screen w-full overflow-hidden bg-[#e9ebe7]">
        <Sidebar />

        {/* Scrollable main content */}
        <main className="scrollbar-slim min-w-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-[#e9ebe7]/85 px-5 pt-4 pb-3 backdrop-blur-sm">
            <TopBar />
          </div>
          <div className="flex flex-col gap-4 px-5 pb-8 pt-2">{children}</div>
        </main>
      </div>
    </UserRoleProvider>
  );
}
