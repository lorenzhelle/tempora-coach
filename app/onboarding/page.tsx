import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChat } from "./chat-view";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/login");
  }

  return <OnboardingChat />;
}
