"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserSessionProps = {
  className?: string;
  showAccountLink?: boolean;
};

type SignedInUser = {
  displayName: string;
  email: string;
};

export default function UserSession({
  className = "",
  showAccountLink = true,
}: UserSessionProps) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!authUser) {
        setUser(null);
        setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name,last_name,email")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!mounted) return;

      const fullName = [profile?.first_name, profile?.last_name]
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim())
        .join(" ");

      const email = profile?.email || authUser.email || "";

      setUser({
        displayName: fullName || email || "Customer",
        email,
      });
      setReady(true);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void loadUser(), 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (!ready) {
    return <div className={`auth-session auth-session-loading ${className}`} aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className={`auth-session ${className}`} aria-label="Account actions">
        <Link href="/login">Login</Link>
        <span className="auth-session-divider" aria-hidden="true">|</span>
        <Link href="/signup">Sign Up</Link>
      </div>
    );
  }

  return (
    <div className={`auth-session ${className}`} aria-label="Signed-in account actions">
      <span className="auth-user-name" title={user.email || user.displayName}>
        {user.displayName}
      </span>
      {showAccountLink && (
        <>
          <span className="auth-session-divider" aria-hidden="true">|</span>
          <Link href="/account">My Account</Link>
        </>
      )}
      <span className="auth-session-divider" aria-hidden="true">|</span>
      <button type="button" onClick={handleLogout}>Logout</button>
    </div>
  );
}
