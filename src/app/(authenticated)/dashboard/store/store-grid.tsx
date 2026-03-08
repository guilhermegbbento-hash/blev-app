"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StoreItem = {
  id: number;
  name: string;
  description: string | null;
  coins_price: number;
};

function CoinIcon({ size = 18 }: { size?: number }) {
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

export function StoreGrid({
  items,
  userCoins,
}: {
  items: StoreItem[];
  userCoins: number;
}) {
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest(itemId: number) {
    setLoadingId(itemId);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("store_requests")
      .insert({ item_id: itemId });

    setLoadingId(null);

    if (insertError) {
      setError("Erro ao enviar solicitação. Tente novamente.");
      return;
    }

    setRequestedIds((prev) => new Set(prev).add(itemId));
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <p className="text-gray-400">Nenhum item disponível no momento.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          className="rounded-xl p-3 mb-4 text-sm text-center"
          style={{ backgroundColor: "#3B1818", color: "#F87171" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const canAfford = userCoins >= item.coins_price;
          const wasRequested = requestedIds.has(item.id);
          const isLoading = loadingId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-xl p-5 flex flex-col justify-between"
              style={{ backgroundColor: "#1A1A1A" }}
            >
              <div>
                <h3 className="font-semibold text-base mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div>
                {/* Price */}
                <div className="flex items-center gap-1.5 mb-3">
                  <CoinIcon />
                  <span
                    className="text-lg font-bold"
                    style={{ color: "#C9A84C" }}
                  >
                    {item.coins_price}
                  </span>
                  <span className="text-xs text-gray-500">BLV</span>
                </div>

                {/* Button */}
                {wasRequested ? (
                  <div
                    className="rounded-lg px-4 py-2.5 text-center text-sm font-medium"
                    style={{ backgroundColor: "#1A2E1A", color: "#4ADE80" }}
                  >
                    Solicitação enviada! Nosso time vai entrar em contato.
                  </div>
                ) : (
                  <button
                    onClick={() => handleRequest(item.id)}
                    disabled={!canAfford || isLoading}
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: canAfford ? "#C9A84C" : "#333",
                      color: canAfford ? "#0A0A0A" : "#666",
                      cursor: canAfford ? "pointer" : "not-allowed",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading
                      ? "Enviando..."
                      : canAfford
                      ? "Solicitar"
                      : "Coins insuficientes"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
