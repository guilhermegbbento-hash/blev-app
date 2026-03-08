import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A", color: "#fff" }}>
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#222" }}>
        <span className="text-xl font-bold tracking-widest" style={{ color: "#C9A84C" }}>
          BLEV
        </span>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              Admin
            </Link>
          )}
          <Link
            href="/dashboard/store"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9h18l-1.5 9a2 2 0 01-2 1.5H6.5a2 2 0 01-2-1.5L3 9z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M8 9V5a4 4 0 118 0v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Loja
          </Link>
          <Link
            href="/dashboard/profile"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M5 20c0-3.3 2.7-6 7-6s7 2.7 7 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Meu Perfil
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
