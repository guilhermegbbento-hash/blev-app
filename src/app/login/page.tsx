"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0A0A" }}>
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-12">
          <h1
            className="text-7xl font-bold tracking-widest"
            style={{ color: "#C9A84C" }}
          >
            BLEV
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 outline-none focus:ring-2"
              style={{
                backgroundColor: "#1A1A1A",
                borderColor: "#333",
                border: "1px solid #333",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#333")}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-500 outline-none focus:ring-2"
              style={{
                backgroundColor: "#1A1A1A",
                borderColor: "#333",
                border: "1px solid #333",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#333")}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#C9A84C" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
