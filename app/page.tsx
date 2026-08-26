import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <main>
      <p>Tempora</p>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <SignOutButton />
        </>
      ) : (
        <p>
          <Link href="/login">Sign in</Link> or{" "}
          <Link href="/signup">sign up</Link>
        </p>
      )}
    </main>
  );
}
