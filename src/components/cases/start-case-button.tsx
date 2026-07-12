"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { createCaseAction } from "@/modules/cases/actions";

type StartCaseButtonProps = {
  storyId: string;
};

export function StartCaseButton({ storyId }: StartCaseButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createCaseAction({ storyId });
      if (result.success) {
        router.push(`/admin/casos/${result.caseId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="w-full sm:w-auto" isLoading={isPending} onClick={handleClick}>
        Iniciar caso
      </Button>
      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
