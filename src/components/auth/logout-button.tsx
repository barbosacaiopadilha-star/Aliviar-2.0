"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

type LogoutButtonProps = {
  className?: string;
};

function LogoutSubmitButton({ className }: LogoutButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" className={cn("w-full", className)} disabled={pending}>
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={signOutAction}>
      <LogoutSubmitButton className={className} />
    </form>
  );
}
