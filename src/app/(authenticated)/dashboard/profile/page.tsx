import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PROFILE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  A: { bg: "#2563EB", text: "#fff", label: "Cenário A — Ainda não tem ponto" },
  B: { bg: "#9333EA", text: "#fff", label: "Cenário B — Já tem ponto definido" },
  C: { bg: "#F97316", text: "#fff", label: "Perfil C — Quer vender projetos" },
};

function CoinIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/dashboard");
  }

  // Fetch phases + progress for this profile type
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("profile_type", profile.profile_type)
    .order("phase_number", { ascending: true });

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  const completedPhases = (progress ?? []).filter(
    (p: { status: string }) => p.status === "completed"
  ).length;
  const totalPhases = phases?.length ?? 0;
  const progressPercent = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  // Fetch all badges (for this profile type + ALL)
  const { data: allBadges } = await supabase
    .from("badges")
    .select("*")
    .in("profile_type", [profile.profile_type, "ALL"])
    .order("id", { ascending: true });

  // Fetch user earned badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", user.id);

  const earnedMap = new Map(
    (userBadges ?? []).map((ub: { badge_id: number; earned_at: string }) => [
      ub.badge_id,
      ub.earned_at,
    ])
  );

  const profileColor = PROFILE_COLORS[profile.profile_type] ?? PROFILE_COLORS.A;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
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

      {/* Profile card */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            {(profile.city || profile.state) && (
              <p className="text-sm text-gray-400 mt-1">
                {[profile.city, profile.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              backgroundColor: profileColor.bg,
              color: profileColor.text,
            }}
          >
            {profileColor.label}
          </span>
        </div>

        {/* Coins */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          <CoinIcon size={36} />
          <div>
            <p
              className="text-3xl font-bold"
              style={{ color: "#C9A84C" }}
            >
              {profile.coins}
            </p>
            <p className="text-xs text-gray-500">BLV Coins</p>
          </div>
        </div>
      </div>

      {/* Progress card */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <h2 className="text-sm font-semibold text-gray-400 mb-3">
          Progresso geral
        </h2>
        <p className="text-lg font-bold mb-3">
          {completedPhases} de {totalPhases} fases concluídas
        </p>
        <div
          className="w-full h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: "#333" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: "#C9A84C",
            }}
          />
        </div>
        <p
          className="text-xs mt-2 text-right font-medium"
          style={{ color: "#C9A84C" }}
        >
          {progressPercent}%
        </p>
      </div>

      {/* Badges section */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 px-1">
        Badges
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {(allBadges ?? []).map(
          (badge: {
            id: number;
            name: string;
            description: string | null;
            icon: string | null;
          }) => {
            const earnedAt = earnedMap.get(badge.id);
            const isEarned = !!earnedAt;

            return (
              <div
                key={badge.id}
                className="rounded-xl p-3 flex flex-col items-center text-center transition-all"
                style={{
                  backgroundColor: "#1A1A1A",
                  opacity: isEarned ? 1 : 0.4,
                  border: isEarned ? "1px solid #C9A84C33" : "1px solid transparent",
                }}
              >
                <span className="text-2xl mb-1.5">
                  {badge.icon ?? "🏅"}
                </span>
                <span
                  className="text-xs font-semibold leading-tight"
                  style={{ color: isEarned ? "#fff" : "#666" }}
                >
                  {badge.name}
                </span>
                {isEarned ? (
                  <span
                    className="text-[10px] mt-1"
                    style={{ color: "#C9A84C" }}
                  >
                    {new Date(earnedAt).toLocaleDateString("pt-BR")}
                  </span>
                ) : (
                  <span className="text-[10px] mt-1 text-gray-600 leading-tight">
                    {badge.description ?? ""}
                  </span>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
