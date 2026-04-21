import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";

export default async function IndexPage() {
  const session = await getSessionFromCookies();
  if (session) redirect("/home");
  redirect("/login");
}
