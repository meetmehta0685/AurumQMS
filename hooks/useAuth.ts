import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isSelfServiceRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

const ALLOWED_ROLES = new Set([
  "patient",
  "doctor",
  "admin",
  "guest",
  "staff",
  "lab",
  "pharma",
]);

function resolveRole(role: unknown): Profile["role"] {
  if (typeof role === "string" && ALLOWED_ROLES.has(role)) {
    return role as Profile["role"];
  }
  return "patient";
}

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

    const fetchProfile = async (currentUser: User) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError) {
          setError(profileError.message);
          setProfile(null);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          return;
        }

        const metadata = currentUser?.user_metadata || {};
        const generatedFullName =
          typeof metadata.full_name === "string" &&
          metadata.full_name.trim().length > 0
            ? metadata.full_name.trim()
            : currentUser?.email?.split("@")[0] || "User";

        if (
          typeof metadata.role === "string" &&
          !isSelfServiceRole(metadata.role)
        ) {
          setError("Your account is awaiting administrator role assignment.");
          setProfile(null);
          return;
        }

        const generatedRole = isSelfServiceRole(metadata.role)
          ? metadata.role
          : resolveRole(metadata.role);

        const { data: insertedProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: currentUser.id,
            role: generatedRole,
            full_name: generatedFullName,
            email: currentUser?.email || "",
          })
          .select("*")
          .maybeSingle();

        if (!isMounted) return;

        if (insertError) {
          setError(insertError.message);
          setProfile(null);
          return;
        }

        setProfile(insertedProfile || null);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    };

    const getAuth = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!currentUser) {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        setUser(currentUser);
        await fetchProfile(currentUser);
      } catch (err: unknown) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session.user);
        await fetchProfile(session.user);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const supabase = supabaseRef.current;
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsLoading(false);
    router.push("/login");
  };

  return { user, profile, isLoading, error, logout };
}
