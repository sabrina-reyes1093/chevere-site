"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ ok?: string; error?: string }>({});

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMessage({});
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setMessage({ error: "Supabase client not available." }); return; }
    if (password.length < 6) { setMessage({ error: "Password must be at least 6 characters." }); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage({ error: error.message });
    else setMessage({ ok: "Password updated! You can now sign in." });
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Private editor</p>
        <h1>Set a new password</h1>
        {message.ok && (
          <>
            <p className="message success">{message.ok}</p>
            <p style={{ marginTop: 16, textAlign: "center" }}>
              <a href="/admin/login" style={{ color: "var(--brown)", textDecoration: "underline" }}>Sign in</a>
            </p>
          </>
        )}
        {!message.ok && (
          <form onSubmit={handleSubmit} className="stack">
            {message.error && <p className="message error">{message.error}</p>}
            <label>
              New password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={6} />
            </label>
            <button className="primary">Update password</button>
          </form>
        )}
      </section>
    </main>
  );
}