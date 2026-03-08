"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Phase {
  id: number;
  phase_number: number;
  name: string;
  description: string | null;
  coins_reward: number;
  profile_type: string;
}

interface Action {
  id: number;
  phase_id: number;
  name: string;
  description: string | null;
  sort_order: number;
}

interface PhaseClientProps {
  phase: Phase;
  actions: Action[];
  initialCompletionMap: Record<number, boolean>;
  userId: string;
  nextPhaseId: number | null;
  progressId: number;
}

function CoinIcon({ size = 22 }: { size?: number }) {
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

export default function PhaseClient({
  phase,
  actions,
  initialCompletionMap,
  userId,
  nextPhaseId,
  progressId,
}: PhaseClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [completionMap, setCompletionMap] = useState(initialCompletionMap);
  const [loading, setLoading] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const allCompleted = actions.every((a) => completionMap[a.id] === true);

  const toggleAction = useCallback(
    async (actionId: number) => {
      if (loading !== null) return;
      setLoading(actionId);

      const newValue = !completionMap[actionId];

      // Optimistic update
      setCompletionMap((prev) => ({ ...prev, [actionId]: newValue }));

      const { error } = await supabase
        .from("user_actions")
        .update({
          completed: newValue,
          completed_at: newValue ? new Date().toISOString() : null,
        })
        .eq("user_id", userId)
        .eq("action_id", actionId);

      if (error) {
        // Revert on error
        setCompletionMap((prev) => ({ ...prev, [actionId]: !newValue }));
      }

      setLoading(null);
    },
    [completionMap, loading, supabase, userId]
  );

  const completePhase = useCallback(async () => {
    if (completing) return;
    setCompleting(true);

    // 1. Mark current phase as completed
    await supabase
      .from("user_progress")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", progressId);

    // 2. Activate next phase if exists
    if (nextPhaseId) {
      await supabase
        .from("user_progress")
        .update({
          status: "active",
          started_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("phase_id", nextPhaseId);
    }

    // 3. Add coins to profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", userId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ coins: profile.coins + phase.coins_reward })
        .eq("id", userId);
    }

    // 4. Show congrats modal
    setShowModal(true);

    // 5. Redirect after 2 seconds
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  }, [completing, supabase, progressId, nextPhaseId, userId, phase.coins_reward, router]);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "#888" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Voltar ao Dashboard
      </button>

      {/* Phase header */}
      <div
        className="rounded-2xl p-5 mb-6 border"
        style={{ backgroundColor: "#1F1A0F", borderColor: "#C9A84C" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#C9A84C22", color: "#C9A84C" }}
          >
            Fase {phase.phase_number}
          </span>
          <div className="flex items-center gap-1">
            <CoinIcon size={16} />
            <span className="text-xs" style={{ color: "#C9A84C" }}>
              +{phase.coins_reward} BLV
            </span>
          </div>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>
          {phase.name}
        </h1>
        {phase.description && (
          <p className="text-sm mt-2" style={{ color: "#999" }}>
            {phase.description}
          </p>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#888" }}>
            Progresso
          </span>
          <span className="text-xs font-medium" style={{ color: "#C9A84C" }}>
            {actions.filter((a) => completionMap[a.id]).length}/{actions.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#333" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: "#C9A84C",
              width: `${(actions.filter((a) => completionMap[a.id]).length / actions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Actions checklist */}
      <div className="space-y-3 mt-6">
        {actions.map((action) => {
          const checked = completionMap[action.id] ?? false;
          const isLoading = loading === action.id;

          return (
            <button
              key={action.id}
              onClick={() => toggleAction(action.id)}
              disabled={isLoading}
              className="w-full text-left rounded-xl p-4 transition-all"
              style={{
                backgroundColor: checked ? "#1A2A1A" : "#1A1A1A",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: checked ? "#16A34A44" : "#2A2A2A",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                  style={{
                    backgroundColor: checked ? "#16A34A" : "transparent",
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderColor: checked ? "#16A34A" : "#555",
                  }}
                >
                  {checked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium block"
                    style={{
                      color: checked ? "#16A34A" : "#ddd",
                      textDecoration: checked ? "line-through" : "none",
                    }}
                  >
                    {action.name}
                  </span>
                  {action.description && (
                    <span
                      className="text-xs block mt-1"
                      style={{ color: checked ? "#555" : "#777" }}
                    >
                      {action.description}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Complete phase button */}
      {allCompleted && (
        <button
          onClick={completePhase}
          disabled={completing}
          className="w-full mt-8 py-4 rounded-xl text-base font-bold transition-all"
          style={{
            backgroundColor: completing ? "#8B6914" : "#C9A84C",
            color: "#0A0A0A",
            opacity: completing ? 0.7 : 1,
          }}
        >
          {completing ? "Concluindo..." : "Concluir Fase"}
        </button>
      )}

      {/* Congrats modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="rounded-2xl p-8 text-center max-w-sm w-full mx-4 animate-in fade-in zoom-in"
            style={{ backgroundColor: "#1A1A1A" }}
          >
            <div className="text-5xl mb-4">&#127881;</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#C9A84C" }}>
              Parabéns!
            </h2>
            <p className="text-gray-400 mb-4">
              Você concluiu a fase &quot;{phase.name}&quot;
            </p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: "#C9A84C22" }}
            >
              <CoinIcon size={24} />
              <span className="text-lg font-bold" style={{ color: "#C9A84C" }}>
                +{phase.coins_reward} BLV
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Redirecionando para o dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
