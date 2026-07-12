"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { resetPatientPasswordAction } from "@/modules/profiles/patient-account-actions";

import { CredentialsReveal } from "./credentials-reveal";

type ResetPatientPasswordButtonProps = {
  profileId: string;
  email: string;
};

export function ResetPatientPasswordButton({ profileId, email }: ResetPatientPasswordButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ password: string } | { error: string } | null>(null);

  function handleClick() {
    startTransition(async () => {
      const response = await resetPatientPasswordAction(profileId);
      setResult(response.success ? { password: response.password } : { error: response.error });
    });
  }

  if (result && "password" in result) {
    return <CredentialsReveal email={email} password={result.password} />;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleClick}
        isLoading={isPending}
        className="w-full sm:w-auto"
      >
        Redefinir senha
      </Button>
      {result && "error" in result ? <FormMessage variant="error">{result.error}</FormMessage> : null}
    </div>
  );
}
