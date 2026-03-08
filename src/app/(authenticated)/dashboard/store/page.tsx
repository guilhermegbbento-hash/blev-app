import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StoreGrid } from "./store-grid";

export default async function StorePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, coins")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/dashboard");
  }

  const { data: items } = await supabase
    .from("store_items")
    .select("*")
    .eq("available", true)
    .order("coins_price", { ascending: true });

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Voltar
      </Link>

      {/* Coins banner */}
      <div
        className="rounded-2xl p-5 mb-8 flex items-center gap-3"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#C9A84C" />
          <circle cx="12" cy="12" r="7" fill="#E8D48B" />
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#8B6914"
          >
            B
          </text>
        </svg>
        <div>
          <p className="text-3xl font-bold" style={{ color: "#C9A84C" }}>
            {profile.coins}
          </p>
          <p className="text-xs text-gray-500">BLV Coins disponíveis</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 px-1">
        Loja de Recompensas
      </h2>

      <StoreGrid items={items ?? []} userCoins={profile.coins} />
    </div>
  );
}
