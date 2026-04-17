"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { isSelfServiceRole, resolveRoleHomeRoute } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!authData.user) {
        toast.error("Login failed");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      let resolvedRole = profile?.role;

      if (!resolvedRole) {
        const metadata = authData.user.user_metadata || {};
        const metadataRole = isSelfServiceRole(metadata.role)
          ? metadata.role
          : "patient";
        const fullName =
          typeof metadata.full_name === "string" && metadata.full_name.trim()
            ? metadata.full_name.trim()
            : authData.user.email?.split("@")[0] || "User";

        const { data: createdProfile, error: profileInsertError } =
          await supabase
            .from("profiles")
            .insert({
              user_id: authData.user.id,
              role: metadataRole,
              full_name: fullName,
              email: authData.user.email || data.email,
            })
            .select("role")
            .maybeSingle();

        if (profileInsertError) {
          toast.error(profileInsertError.message);
          return;
        }

        resolvedRole = createdProfile?.role || metadataRole;
      }

      toast.success("Login successful");
      router.push(resolveRoleHomeRoute(resolvedRole));
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Button asChild variant="ghost" className="w-fit px-0">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Card>
            <CardHeader className="gap-4">
              <Badge variant="secondary" className="w-fit">
                Secure access
              </Badge>
              <div className="space-y-3">
                <CardTitle className="font-display text-4xl">Sign in</CardTitle>
                <CardDescription className="text-base">
                  Use your existing account to continue into the role-based
                  workspace.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Guests can manage reservations and requests.</p>
              <p>
                Elevated clinical and operations accounts are provisioned by an
                administrator and still route into their existing workspaces.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account login</CardTitle>
              <CardDescription>
                Authentication uses Supabase and keeps your existing routing
                behavior.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="size-4 text-primary" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="size-4 text-primary" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-sm text-muted-foreground">
                Need an account?{" "}
                <Link
                  href="/register"
                  className="text-primary underline underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
