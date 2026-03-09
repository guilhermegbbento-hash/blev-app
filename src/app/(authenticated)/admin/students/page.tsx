import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StudentFilter } from "./student-filter";

const PROFILE_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: "#2563EB", text: "#fff" },
  B: { bg: "#9333EA", text: "#fff" },
  C: { bg: "#F97316", text: "#fff" },
};

export type StudentRow = {
  id: string;
  name: string;
  city: string | null;
  profile_type: string;
  coins: number;
  currentPhaseName: string | null;
  daysInPhase: number | null;
};

export default async function StudentsPage() {
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

  // All non-admin students
  const { data: students } = await supabase
    .from("profiles")
    .select("id, name, city, profile_type, coins")
    .eq("is_admin", false)
    .order("name", { ascending: true });

  // Active progress for all users
  const { data: activeProgress } = await supabase
    .from("user_progress")
    .select("user_id, phase_id, started_at")
    .eq("status", "active");

  // All phases
  const { data: phases } = await supabase
    .from("phases")
    .select("id, name");

  const phaseMap = new Map((phases ?? []).map((p: { id: number; name: string }) => [p.id, p.name]));

  const activeMap = new Map(
    (activeProgress ?? []).map((p: { user_id: string; phase_id: number; started_at: string }) => [
      p.user_id,
      { phaseId: p.phase_id, startedAt: p.started_at },
    ])
  );

  const now = Date.now();

  const rows: StudentRow[] = (students ?? []).map(
    (s: { id: string; name: string; city: string | null; profile_type: string; coins: number }) => {
      const active = activeMap.get(s.id);
      let currentPhaseName: string | null = null;
      let daysInPhase: number | null = null;

      if (active) {
        currentPhaseName = phaseMap.get(active.phaseId) ?? null;
        if (active.startedAt) {
          daysInPhase = Math.floor((now - new Date(active.startedAt).getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: s.id,
        name: s.name,
        city: s.city,
        profile_type: s.profile_type,
        coins: s.coins,
        currentPhaseName,
        daysInPhase,
      };
    }
  );

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>
            Alunos
          </h1>
        </div>
        <Link
          href="/admin/students/new"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{ backgroundColor: "#C9A84C", color: "#0A0A0A" }}
        >
          + Novo Aluno
        </Link>
      </div>

      <StudentFilter rows={rows} profileColors={PROFILE_COLORS} />
    </div>
  );
}
