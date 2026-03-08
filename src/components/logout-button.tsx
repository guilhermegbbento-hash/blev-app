"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
      style={{ backgroundColor: "#1A1A1A", color: "#C9A84C", border: "1px solid #333" }}
    >
      Sair
    </button>
  );
}
