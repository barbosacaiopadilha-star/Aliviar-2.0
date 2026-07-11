"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "loading" | "ready" | "invalid";

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<RecoveryState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setState("ready");
      }
    });

    const timeout = window.setTimeout(() => {
      setState((current) => (current === "loading" ? "invalid" : current));
    }, 5000);

    return () => {
      authListener.subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Não foi possível atualizar a senha. Solicite um novo link de recuperação.");
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setSubmitting(false);
    router.push("/login?reset=success");
  }

  if (success) {
    return (
      <div className="rounded-lg border border-[var(--sage)] bg-[var(--sage-soft)] px-4 py-3 text-sm text-ink">
        Senha atualizada com sucesso. Redirecionando para o login...
      </div>
    );
  }

  if (state === "loading") {
    return <p className="text-sm text-ink-soft">Validando link de recuperação...</p>;
  }

  if (state === "invalid") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
          Link inválido ou expirado. Solicite um novo link de recuperação.
        </div>
        <Link href="/auth/forgot-password" className="btn-primary block w-full text-center">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-[#B84C3C] bg-[#F5DCD6] px-4 py-3 text-sm text-[#B84C3C]">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="field-label">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="field-label">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={submitting}>
        {submitting ? "Salvando..." : "Definir nova senha"}
      </button>
    </form>
  );
}
