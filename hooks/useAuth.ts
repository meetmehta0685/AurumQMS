import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

// Profiles are created by the `handle_new_user` database trigger at signup,
// so this hook only reads them.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let isMounted = true;
    const supabase = supabaseRef.current;

    const load = async (currentUser: User | null) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!isMounted) return;
      setProfile(data ?? null);
      setError(
        profileError?.message ??
          (data ? null : "No profile found for this account."),
      );
      setIsLoading(false);
    };

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isMounted) return load(data.user);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load session");
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") {
        load(null);
      } else if (event === "SIGNED_IN" && session) {
        load(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await supabaseRef.current.auth.signOut();
    router.push("/login");
  };

  return { user, profile, isLoading, error, logout };
}
