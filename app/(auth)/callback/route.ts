import { isSelfServiceRole, resolveRoleHomeRoute } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        let resolvedRole = profile?.role;

        if (!resolvedRole) {
          const metadata = user.user_metadata || {};
          const metadataRole = isSelfServiceRole(metadata.role)
            ? metadata.role
            : "patient";
          const fullName =
            typeof metadata.full_name === "string" &&
            metadata.full_name.trim().length > 0
              ? metadata.full_name.trim()
              : user.email?.split("@")[0] || "User";

          const { data: createdProfile } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              role: metadataRole,
              full_name: fullName,
              email: user.email || "",
            })
            .select("role")
            .maybeSingle();

          resolvedRole = createdProfile?.role || metadataRole;
        }

        const redirectPath = resolveRoleHomeRoute(resolvedRole);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      return NextResponse.redirect(new URL("/patient", request.url));
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
