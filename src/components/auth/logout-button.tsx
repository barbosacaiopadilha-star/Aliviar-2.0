import { signOutAction } from "@/modules/auth/actions";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary" size="sm" className={cn("w-full", className)}>
        Sair
      </Button>
    </form>
  );
}
