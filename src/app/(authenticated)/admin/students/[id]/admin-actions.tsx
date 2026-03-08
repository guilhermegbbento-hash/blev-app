"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AdminActions({
  studentId,
  currentNotes,
}: {
  studentId: string;
  currentNotes: string;
}) {
  const router = useRouter();
  const [coins, setCoins] = useState("");
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [coinsMsg, setCoinsMsg] = useState<string | null>(null);

  const [notes, setNotes] = useState(currentNotes);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesMsg, setNotesMsg] = useState<string | null>(null);

  async function handleGiveCoins() {
    const amount = parseInt(coins, 10);
    if (!amount || amount <= 0) return;

    setCoinsLoading(true);
    setCoinsMsg(null);

    const supabase = createClient();

    // Get current coins
    const { data: profile } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", studentId)
      .single();

    if (!profile) {
      setCoinsMsg("Erro ao buscar perfil.");
      setCoinsLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ coins: profile.coins + amount })
      .eq("id", studentId);

    setCoinsLoading(false);

    if (error) {
      setCoinsMsg("Erro ao dar coins.");
      return;
    }

    setCoinsMsg(`+${amount} coins adicionados!`);
    setCoins("");
    router.refresh();
  }

  async function handleSaveNotes() {
    setNotesLoading(true);
    setNotesMsg(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ notes })
      .eq("id", studentId);

    setNotesLoading(false);

    if (error) {
      setNotesMsg("Erro ao salvar notas.");
      return;
    }

    setNotesMsg("Notas salvas!");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Give coins */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "#1A1A1A" }}>
        <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Dar coins</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={coins}
            onChange={(e) => setCoins(e.target.value)}
            placeholder="Qtd"
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: "#0A0A0A", color: "#fff", border: "1px solid #333" }}
          />
          <button
            onClick={handleGiveCoins}
            disabled={coinsLoading || !coins}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#C9A84C",
              color: "#0A0A0A",
              opacity: coinsLoading || !coins ? 0.5 : 1,
            }}
          >
            {coinsLoading ? "..." : "Dar"}
          </button>
        </div>
        {coinsMsg && (
          <p className="text-xs mt-2" style={{ color: "#4ADE80" }}>
            {coinsMsg}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl p-4" style={{ backgroundColor: "#1A1A1A" }}>
        <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Notas</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Adicionar anotação sobre o aluno..."
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
          style={{ backgroundColor: "#0A0A0A", color: "#fff", border: "1px solid #333" }}
        />
        <button
          onClick={handleSaveNotes}
          disabled={notesLoading}
          className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all w-full"
          style={{
            backgroundColor: "#C9A84C",
            color: "#0A0A0A",
            opacity: notesLoading ? 0.5 : 1,
          }}
        >
          {notesLoading ? "Salvando..." : "Salvar notas"}
        </button>
        {notesMsg && (
          <p className="text-xs mt-2" style={{ color: "#4ADE80" }}>
            {notesMsg}
          </p>
        )}
      </div>
    </div>
  );
}
