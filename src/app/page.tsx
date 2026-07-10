import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/staff";

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? "/workspace" : "/login");
}
