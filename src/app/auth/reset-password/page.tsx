import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;

  if (params.code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      redirect("/auth/forgot-password?error=invalid_link");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold text-ink">Nova senha</h1>
          <p className="mt-2 text-sm text-ink-soft">Defina uma nova senha para sua conta.</p>
        </div>

        <ResetPasswordForm />

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-ink-soft underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
