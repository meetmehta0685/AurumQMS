import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAllowedRolesForPath, resolveRoleHomeRoute } from "@/lib/auth/roles";

// Refreshes the Supabase session cookie on every request and enforces the
// role required by protected route prefixes. Fails closed: if the role cannot
// be verified, protected routes redirect to /login.
export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;
  const requiredRoles = getAllowedRolesForPath(pathname);

  const loginRedirect = () => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!requiredRoles) {
      return response;
    }
    if (!user) {
      return loginRedirect();
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.role) {
      return loginRedirect();
    }
    if (!requiredRoles.includes(profile.role)) {
      return NextResponse.redirect(
        new URL(resolveRoleHomeRoute(profile.role), request.url),
      );
    }
    return response;
  } catch (error) {
    console.error("Supabase session check failed:", error);
    return requiredRoles ? loginRedirect() : response;
  }
};
