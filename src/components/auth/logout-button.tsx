import { signOutAction } from "@/modules/auth/actions";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="secondary">
        Sair
      </Button>
    </form>
  );
}
