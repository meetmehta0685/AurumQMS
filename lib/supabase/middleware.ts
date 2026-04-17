import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAllowedRolesForPath, resolveRoleHomeRoute } from "@/lib/auth/roles";

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/callback")
  ) {
    return response;
  }

  const requiredRoles = getAllowedRolesForPath(pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Skip session update if Supabase is not configured
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options as CookieOptions);
        });
      },
    },
  });

  // Avoid blocking navigation if Supabase auth fetch fails in edge runtime
  try {
    // This refreshes a user's session in case it has expired
    await supabase.auth.getSession();

    if (!requiredRoles) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!requiredRoles.includes(profile.role)) {
      return NextResponse.redirect(
        new URL(resolveRoleHomeRoute(profile.role), request.url),
      );
    }
  } catch (error) {
    console.warn("Supabase session refresh failed:", error);
  }

  return response;
};
