"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="cursor-pointer rounded-chip border border-border bg-transparent px-3 py-1.5 font-heading text-[13px] text-text-muted hover:border-accent hover:text-text"
    >
      Sign out
    </button>
  );
}
