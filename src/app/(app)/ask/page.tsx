import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import AskChat from "@/components/AskChat";

export default async function AskPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <AskChat />;
}
