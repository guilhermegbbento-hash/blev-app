import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PhaseClient from "./phase-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PhasePage({ params }: PageProps) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  if (isNaN(phaseId)) redirect("/dashboard");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch phase
  const { data: phase } = await supabase
    .from("phases")
    .select("*")
    .eq("id", phaseId)
    .single();

  if (!phase) redirect("/dashboard");

  // Check user progress - must be active
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("phase_id", phaseId)
    .single();

  if (!progress || progress.status !== "active") redirect("/dashboard");

  // Fetch actions for this phase
  const { data: actions } = await supabase
    .from("actions")
    .select("*")
    .eq("phase_id", phaseId)
    .order("sort_order", { ascending: true });

  if (!actions || actions.length === 0) redirect("/dashboard");

  // Fetch existing user_actions
  const actionIds = actions.map((a: { id: number }) => a.id);
  const { data: existingUserActions } = await supabase
    .from("user_actions")
    .select("*")
    .eq("user_id", user.id)
    .in("action_id", actionIds);

  // If no user_actions exist for this phase, create them
  const existingActionIds = new Set(
    (existingUserActions ?? []).map((ua: { action_id: number }) => ua.action_id)
  );
  const missingActions = actions.filter(
    (a: { id: number }) => !existingActionIds.has(a.id)
  );

  if (missingActions.length > 0) {
    await supabase.from("user_actions").insert(
      missingActions.map((a: { id: number }) => ({
        user_id: user.id,
        action_id: a.id,
        completed: false,
      }))
    );
  }

  // Re-fetch user_actions after potential insert
  const { data: userActions } = await supabase
    .from("user_actions")
    .select("*")
    .eq("user_id", user.id)
    .in("action_id", actionIds);

  // Build map action_id -> completed
  const completionMap: Record<number, boolean> = {};
  (userActions ?? []).forEach(
    (ua: { action_id: number; completed: boolean }) => {
      completionMap[ua.action_id] = ua.completed;
    }
  );

  // Find next phase for progression
  const { data: nextPhase } = await supabase
    .from("phases")
    .select("id")
    .eq("profile_type", phase.profile_type)
    .eq("phase_number", phase.phase_number + 1)
    .single();

  return (
    <PhaseClient
      phase={phase}
      actions={actions}
      initialCompletionMap={completionMap}
      userId={user.id}
      nextPhaseId={nextPhase?.id ?? null}
      progressId={progress.id}
    />
  );
}
