import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminActions } from "./admin-actions";

const PROFILE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#2563EB", text: "#fff" },
  B: { bg: "#9333EA", text: "#fff" },
  C: { bg: "#F97316", text: "#fff" },
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!adminProfile?.is_admin) redirect("/dashboard");

  // Student profile
  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) redirect("/admin/students");

  const pc = PROFILE_COLORS[student.profile_type] ?? PROFILE_COLORS.A;

  // Phases for this profile type
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("profile_type", student.profile_type)
    .order("phase_number", { ascending: true });

  // User progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", studentId);

  const progressMap = new Map(
    (progress ?? []).map((p: { phase_id: number; status: string; started_at: string | null; completed_at: string | null }) => [
      p.phase_id,
      p,
    ])
  );

  // All actions for these phases
  const phaseIds = (phases ?? []).map((p: { id: number }) => p.id);
  const { data: actions } = await supabase
    .from("actions")
    .select("*")
    .in("phase_id", phaseIds.length > 0 ? phaseIds : [0])
    .order("sort_order", { ascending: true });

  // User completed actions
  const { data: userActions } = await supabase
    .from("user_actions")
    .select("action_id, completed, completed_at")
    .eq("user_id", studentId);

  const userActionMap = new Map(
    (userActions ?? []).map((ua: { action_id: number; completed: boolean; completed_at: string | null }) => [
      ua.action_id,
      ua,
    ])
  );

  // Group actions by phase
  const actionsByPhase = new Map<number, { id: number; name: string; sort_order: number }[]>();
  for (const a of actions ?? []) {
    const list = actionsByPhase.get(a.phase_id) ?? [];
    list.push(a);
    actionsByPhase.set(a.phase_id, list);
  }

  // Store requests
  const { data: storeRequests } = await supabase
    .from("store_requests")
    .select("id, item_id, status, created_at")
    .eq("user_id", studentId)
    .order("created_at", { ascending: false });

  // Store items for request names
  const itemIds = [...new Set((storeRequests ?? []).map((r: { item_id: number }) => r.item_id))];
  const { data: storeItems } = await supabase
    .from("store_items")
    .select("id, name")
    .in("id", itemIds.length > 0 ? itemIds : [0]);

  const itemMap = new Map((storeItems ?? []).map((i: { id: number; name: string }) => [i.id, i.name]));

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar
      </Link>

      {/* Student info card */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{student.name}</h1>
            {(student.city || student.state) && (
              <p className="text-sm text-gray-400 mt-0.5">
                {[student.city, student.state].filter(Boolean).join(", ")}
              </p>
            )}
            {student.phone && (
              <p className="text-sm text-gray-500 mt-0.5">{student.phone}</p>
            )}
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: pc.bg, color: pc.text }}
          >
            {student.profile_type === "A"
              ? "Cenário A — Ainda não tem ponto"
              : student.profile_type === "B"
              ? "Cenário B — Já tem ponto definido"
              : "Perfil C — Quer vender projetos"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#C9A84C" />
              <circle cx="12" cy="12" r="7" fill="#E8D48B" />
              <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8B6914">B</text>
            </svg>
            <span className="text-lg font-bold" style={{ color: "#C9A84C" }}>
              {student.coins}
            </span>
            <span className="text-xs text-gray-500">BLV Coins</span>
          </div>
        </div>

        {student.notes && (
          <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: "#0A0A0A" }}>
            <p className="text-xs text-gray-500 mb-1 font-medium">Notas</p>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{student.notes}</p>
          </div>
        )}
      </div>

      {/* Admin actions: give coins + add note */}
      <AdminActions studentId={studentId} currentNotes={student.notes ?? ""} />

      {/* Trail */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 mt-8 px-1">
        Trilha do aluno
      </h2>

      <div className="space-y-3 mb-8">
        {(phases ?? []).map((phase: { id: number; phase_number: number; name: string; coins_reward: number }) => {
          const prog = progressMap.get(phase.id) as { status: string; started_at: string | null; completed_at: string | null } | undefined;
          const status = prog?.status ?? "locked";
          const phaseActions = actionsByPhase.get(phase.id) ?? [];

          let statusBadge: { label: string; bg: string; color: string };
          if (status === "completed") {
            statusBadge = { label: "Concluída", bg: "#16A34A22", color: "#4ADE80" };
          } else if (status === "active") {
            statusBadge = { label: "Em andamento", bg: "#C9A84C22", color: "#C9A84C" };
          } else {
            statusBadge = { label: "Bloqueada", bg: "#33333366", color: "#666" };
          }

          return (
            <div
              key={phase.id}
              className="rounded-xl p-4"
              style={{
                backgroundColor: "#1A1A1A",
                opacity: status === "locked" ? 0.5 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">
                  {phase.phase_number}. {phase.name}
                </h3>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}
                >
                  {statusBadge.label}
                </span>
              </div>

              {status !== "locked" && phaseActions.length > 0 && (
                <div className="space-y-1 mt-2">
                  {phaseActions.map((action: { id: number; name: string }) => {
                    const ua = userActionMap.get(action.id) as { completed: boolean; completed_at: string | null } | undefined;
                    const done = ua?.completed ?? false;

                    return (
                      <div
                        key={action.id}
                        className="flex items-center gap-2 text-xs py-1"
                      >
                        {done ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" fill="#16A34A" />
                            <path d="M7 12l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div
                            className="w-3.5 h-3.5 rounded-full border"
                            style={{ borderColor: "#444" }}
                          />
                        )}
                        <span style={{ color: done ? "#ccc" : "#666" }}>
                          {action.name}
                        </span>
                        {done && ua?.completed_at && (
                          <span className="text-gray-600 ml-auto">
                            {new Date(ua.completed_at).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Store requests */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4 px-1">
        Solicitações da loja
      </h2>

      {(storeRequests ?? []).length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ backgroundColor: "#1A1A1A" }}>
          <p className="text-gray-500 text-sm">Nenhuma solicitação.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(storeRequests ?? []).map((req: { id: number; item_id: number; status: string; created_at: string }) => (
            <div
              key={req.id}
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: "#1A1A1A" }}
            >
              <div>
                <p className="text-sm font-medium">{itemMap.get(req.item_id) ?? "Item"}</p>
                <p className="text-xs text-gray-500">
                  {new Date(req.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: req.status === "sent" ? "#16A34A22" : "#C9A84C22",
                  color: req.status === "sent" ? "#4ADE80" : "#C9A84C",
                }}
              >
                {req.status === "sent" ? "Enviado" : "Pendente"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
