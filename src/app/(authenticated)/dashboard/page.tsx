import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PROFILE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#2563EB", text: "#fff" },
  B: { bg: "#9333EA", text: "#fff" },
  C: { bg: "#F97316", text: "#fff" },
};

function CoinIcon() {
  return (
    <svg
      width="22"
      height="22"
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

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" fill="#555" />
      <path
        d="M8 11V7a4 4 0 118 0v4"
        stroke="#555"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function DashboardPage() {
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
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-6">
        <div
          className="rounded-2xl p-8 text-center max-w-md w-full"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2">Perfil pendente</h2>
          <p className="text-gray-400">
            Aguarde seu perfil ser configurado pelo time BLEV.
          </p>
        </div>
      </div>
    );
  }

  // Fetch phases for this profile type
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("profile_type", profile.profile_type)
    .order("phase_number", { ascending: true });

  // Fetch user progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map(
    (progress ?? []).map((p: { phase_id: number; status: string }) => [
      p.phase_id,
      p.status,
    ])
  );

  const profileColor = PROFILE_COLORS[profile.profile_type] ?? PROFILE_COLORS.A;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header card */}
      <div
        className="rounded-2xl p-5 mb-8"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: profileColor.bg,
                  color: profileColor.text,
                }}
              >
                {profile.profile_type === "A"
                  ? "Cenário A — Ainda não tem ponto"
                  : profile.profile_type === "B"
                  ? "Cenário B — Já tem ponto definido"
                  : "Perfil C — Quer vender projetos"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CoinIcon />
            <span
              className="text-xl font-bold"
              style={{ color: "#C9A84C" }}
            >
              {profile.coins}
            </span>
          </div>
        </div>
      </div>

      {/* Phase title */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6 px-1">
        Sua trilha
      </h2>

      {/* Roadmap */}
      <div className="relative">
        {(phases ?? []).map(
          (
            phase: {
              id: number;
              phase_number: number;
              name: string;
              description: string | null;
              coins_reward: number;
            },
            index: number
          ) => {
            const status = progressMap.get(phase.id) ?? "locked";
            const isLast = index === (phases?.length ?? 0) - 1;

            const isCompleted = status === "completed";
            const isActive = status === "active";
            const isLocked = status === "locked";

            // Circle styles
            let circleBg = "#333";
            let circleBorder = "#333";
            let circleContent: React.ReactNode = (
              <span className="text-sm font-bold text-gray-500">
                {phase.phase_number}
              </span>
            );

            if (isCompleted) {
              circleBg = "#16A34A";
              circleBorder = "#16A34A";
              circleContent = <CheckIcon />;
            } else if (isActive) {
              circleBg = "#1A1A1A";
              circleBorder = "#C9A84C";
              circleContent = (
                <span className="text-sm font-bold" style={{ color: "#C9A84C" }}>
                  {phase.phase_number}
                </span>
              );
            }

            // Line color
            const lineColor = isCompleted ? "#16A34A" : "#333";

            const card = (
              <div className="flex gap-4" key={phase.id}>
                {/* Left: circle + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? "ring-2 ring-offset-2 animate-pulse" : ""
                    }`}
                    style={{
                      backgroundColor: circleBg,
                      borderWidth: 2,
                      borderColor: circleBorder,
                      borderStyle: "solid",
                      ...(isActive
                        ? {
                            ["--tw-ring-offset-color" as string]: "#0A0A0A",
                            ["--tw-ring-color" as string]: "#C9A84C",
                          }
                        : {}),
                    }}
                  >
                    {circleContent}
                  </div>
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 min-h-[24px]"
                      style={{ backgroundColor: lineColor }}
                    />
                  )}
                </div>

                {/* Right: card */}
                <div
                  className={`rounded-xl p-4 mb-3 flex-1 transition-all ${
                    isActive
                      ? "border"
                      : isCompleted
                      ? "border border-transparent"
                      : ""
                  }`}
                  style={{
                    backgroundColor: isActive ? "#1F1A0F" : "#1A1A1A",
                    borderColor: isActive ? "#C9A84C" : "transparent",
                    opacity: isLocked ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3
                      className="font-semibold text-sm"
                      style={{
                        color: isActive
                          ? "#C9A84C"
                          : isCompleted
                          ? "#fff"
                          : "#888",
                      }}
                    >
                      {phase.name}
                    </h3>
                    {isLocked && <LockIcon />}
                    {isCompleted && (
                      <span className="text-xs text-green-500 font-medium">
                        Concluída
                      </span>
                    )}
                    {isActive && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#C9A84C22", color: "#C9A84C" }}
                      >
                        Em andamento
                      </span>
                    )}
                  </div>
                  {phase.description && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: isLocked ? "#555" : "#888" }}
                    >
                      {phase.description}
                    </p>
                  )}
                  {!isLocked && (
                    <div className="flex items-center gap-1 mt-2">
                      <CoinIcon />
                      <span className="text-xs" style={{ color: "#C9A84C" }}>
                        +{phase.coins_reward} BLV
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );

            if (isActive) {
              return (
                <Link
                  key={phase.id}
                  href={`/dashboard/phase/${phase.id}`}
                  className="block"
                >
                  {card}
                </Link>
              );
            }

            return card;
          }
        )}
      </div>
    </div>
  );
}
