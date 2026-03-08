import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PROFILE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#2563EB", text: "#fff" },
  B: { bg: "#9333EA", text: "#fff" },
  C: { bg: "#F97316", text: "#fff" },
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/dashboard");

  // All students
  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, profile_type")
    .eq("is_admin", false);

  const totalStudents = students?.length ?? 0;
  const byProfile = { A: 0, B: 0, C: 0 };
  for (const s of students ?? []) {
    if (s.profile_type in byProfile) {
      byProfile[s.profile_type as keyof typeof byProfile]++;
    }
  }

  // Stuck students: active progress with started_at > 7 days ago and not completed
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stuckProgress } = await supabase
    .from("user_progress")
    .select("user_id")
    .eq("status", "active")
    .lt("started_at", sevenDaysAgo);

  const stuckCount = new Set((stuckProgress ?? []).map((p: { user_id: string }) => p.user_id)).size;

  // Last 10 completed actions
  const { data: recentActions } = await supabase
    .from("user_actions")
    .select("completed_at, user_id, action_id")
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(10);

  // Fetch related data for feed
  let feedItems: { userName: string; actionName: string; completedAt: string }[] = [];
  if (recentActions && recentActions.length > 0) {
    const userIds = [...new Set(recentActions.map((a: { user_id: string }) => a.user_id))];
    const actionIds = [...new Set(recentActions.map((a: { action_id: number }) => a.action_id))];

    const { data: feedProfiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    const { data: feedActions } = await supabase
      .from("actions")
      .select("id, name")
      .in("id", actionIds);

    const profileMap = new Map((feedProfiles ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
    const actionMap = new Map((feedActions ?? []).map((a: { id: number; name: string }) => [a.id, a.name]));

    feedItems = recentActions.map((ra: { user_id: string; action_id: number; completed_at: string }) => ({
      userName: profileMap.get(ra.user_id) ?? "—",
      actionName: actionMap.get(ra.action_id) ?? "—",
      completedAt: ra.completed_at,
    }));
  }

  const metrics = [
    { label: "Total de alunos", value: totalStudents, color: "#C9A84C" },
    { label: "Perfil A", value: byProfile.A, color: "#2563EB" },
    { label: "Perfil B", value: byProfile.B, color: "#9333EA" },
    { label: "Perfil C", value: byProfile.C, color: "#F97316" },
    { label: "Travados (7+ dias)", value: stuckCount, color: "#EF4444" },
  ];

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>
          Painel Admin
        </h1>
        <Link
          href="/admin/students"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{ backgroundColor: "#C9A84C", color: "#0A0A0A" }}
        >
          Ver todos os alunos
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "#1A1A1A" }}
          >
            <p className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Feed */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 px-1">
        Atividade recente
      </h2>

      {feedItems.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          <p className="text-gray-500 text-sm">Nenhuma ação concluída ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feedItems.map((item, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ backgroundColor: "#1A1A1A" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.userName}</p>
                <p className="text-xs text-gray-400 truncate">{item.actionName}</p>
              </div>
              <span className="text-xs text-gray-600 shrink-0">
                {new Date(item.completedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
