import { LogoutButton } from "@/components/auth/logout-button";
import { getAuthState } from "@/modules/auth/session";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await getAuthState();

  return (
    <>
      {authState ? (
        <div className="fixed right-4 top-4 z-10">
          <LogoutButton />
        </div>
      ) : null}
      {children}
    </>
  );
}
