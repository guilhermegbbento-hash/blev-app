"use client";

import { useState } from "react";
import Link from "next/link";
import type { StudentRow } from "./page";

export function StudentFilter({
  rows,
  profileColors,
}: {
  rows: StudentRow[];
  profileColors: Record<string, { bg: string; text: string }>;
}) {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.profile_type === filter);

  const filters = [
    { key: "ALL", label: "Todos" },
    { key: "A", label: "Cenário A" },
    { key: "B", label: "Cenário B" },
    { key: "C", label: "Perfil C" },
  ];

  return (
    <>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === f.key ? "#C9A84C" : "#1A1A1A",
              color: filter === f.key ? "#0A0A0A" : "#888",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Cidade</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Perfil</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Fase atual</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Dias</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold uppercase">Coins</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isStuck = row.daysInPhase !== null && row.daysInPhase >= 7;
                  const pc = profileColors[row.profile_type] ?? profileColors.A;

                  return (
                    <Link
                      key={row.id}
                      href={`/admin/students/${row.id}`}
                      className="contents"
                    >
                      <tr
                        className="cursor-pointer transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: isStuck ? "#2A1215" : "transparent",
                          borderBottom: "1px solid #222",
                        }}
                      >
                        <td className="px-4 py-3 font-medium">{row.name}</td>
                        <td className="px-4 py-3 text-gray-400">{row.city ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: pc.bg, color: pc.text }}
                          >
                            {row.profile_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{row.currentPhaseName ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {row.daysInPhase !== null ? (
                            <span style={{ color: isStuck ? "#EF4444" : "#888" }}>
                              {row.daysInPhase}d
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: "#C9A84C" }}>
                          {row.coins}
                        </td>
                      </tr>
                    </Link>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
