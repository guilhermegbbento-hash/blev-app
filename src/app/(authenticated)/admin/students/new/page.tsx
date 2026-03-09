"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PROFILE_OPTIONS = [
  { value: "A", label: "Cenário A — Ainda não tem ponto" },
  { value: "B", label: "Cenário B — Já tem ponto definido" },
  { value: "C", label: "Perfil C — Quer vender projetos" },
];

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [profileType, setProfileType] = useState("A");
  const [availableCapital, setAvailableCapital] = useState("");
  const [hasCompany, setHasCompany] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Erro ao criar usuário");

      const userId = authData.user.id;

      // 2. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        name,
        email,
        phone: phone || null,
        city: city || null,
        state: state || null,
        profile_type: profileType,
        available_capital: availableCapital || null,
        has_company: hasCompany,
        has_partner: hasPartner,
        notes: notes || null,
        coins: 0,
        is_admin: false,
      });

      if (profileError) throw new Error(profileError.message);

      // 3. Fetch phases for this profile type
      const { data: phases, error: phasesError } = await supabase
        .from("phases")
        .select("id, phase_number")
        .eq("profile_type", profileType)
        .order("phase_number", { ascending: true });

      if (phasesError) throw new Error(phasesError.message);

      // 4. Create user_progress: first phase active, rest locked
      if (phases && phases.length > 0) {
        const progressRows = phases.map(
          (phase: { id: number; phase_number: number }, index: number) => ({
            user_id: userId,
            phase_id: phase.id,
            status: index === 0 ? "active" : "locked",
            started_at: index === 0 ? new Date().toISOString() : null,
          })
        );

        const { error: progressError } = await supabase
          .from("user_progress")
          .insert(progressRows);

        if (progressError) throw new Error(progressError.message);
      }

      router.push("/admin/students");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    backgroundColor: "#0A0A0A",
    borderColor: "#333",
    color: "#fff",
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/students"
          className="text-gray-400 hover:text-white transition-colors"
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
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#C9A84C" }}>
          Novo Aluno
        </h1>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ backgroundColor: "#2A1215", color: "#EF4444" }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Nome *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
              style={inputStyle}
            />
          </div>

          {/* Email + Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
              style={inputStyle}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Estado
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
                style={inputStyle}
              >
                <option value="">Selecione</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Perfil *
            </label>
            <select
              required
              value={profileType}
              onChange={(e) => setProfileType(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
              style={inputStyle}
            >
              {PROFILE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Capital disponível */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Capital disponível
            </label>
            <input
              type="text"
              value={availableCapital}
              onChange={(e) => setAvailableCapital(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors"
              style={inputStyle}
              placeholder="Ex: R$ 50.000"
            />
          </div>

          {/* Tem empresa + Tem sócio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Tem empresa?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasCompany(true)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: hasCompany ? "#C9A84C22" : "#0A0A0A",
                    borderColor: hasCompany ? "#C9A84C" : "#333",
                    color: hasCompany ? "#C9A84C" : "#888",
                  }}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setHasCompany(false)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: !hasCompany ? "#C9A84C22" : "#0A0A0A",
                    borderColor: !hasCompany ? "#C9A84C" : "#333",
                    color: !hasCompany ? "#C9A84C" : "#888",
                  }}
                >
                  Não
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Tem sócio?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasPartner(true)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: hasPartner ? "#C9A84C22" : "#0A0A0A",
                    borderColor: hasPartner ? "#C9A84C" : "#333",
                    color: hasPartner ? "#C9A84C" : "#888",
                  }}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setHasPartner(false)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: !hasPartner ? "#C9A84C22" : "#0A0A0A",
                    borderColor: !hasPartner ? "#C9A84C" : "#333",
                    color: !hasPartner ? "#C9A84C" : "#888",
                  }}
                >
                  Não
                </button>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:border-[#C9A84C] transition-colors resize-none"
              style={inputStyle}
              placeholder="Observações sobre o aluno..."
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#C9A84C", color: "#0A0A0A" }}
        >
          {loading ? "Criando..." : "Criar Aluno"}
        </button>
      </form>
    </div>
  );
}
