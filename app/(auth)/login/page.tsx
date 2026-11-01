"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { roleMeta, suiteMeta } from "@/components/layout/role-config";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { resolveRoleHomeRoute } from "@/lib/auth/roles";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const demoRoles: UserRole[] = [
  "patient",
  "doctor",
  "admin",
  "lab",
  "pharma",
  "guest",
  "staff",
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const fillDemoAccount = (role: UserRole) => {
    const email = `${role}@demo.com`;
    form.setValue("email", email);
    form.setValue("password", "password123");
    toast.info(`Filled credentials for ${roleMeta[role].shortLabel}`);
  };

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
        toast.error("Login failed. Try again.");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      // Return to the protected page that sent the user here, if any.
      const next = new URLSearchParams(window.location.search).get("next");
      const target =
        next?.startsWith("/") && !next.startsWith("//")
          ? next
          : resolveRoleHomeRoute(profileData?.role);

      if (!profileData?.role) {
        toast.error("No profile found for this account.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Welcome back. Opening your workspace.");
      router.push(target);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("We could not start your session. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="t-rise flex w-full max-w-[400px] flex-col gap-7">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Your role decides the workspace, navigation, and actions you see.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-md sm:p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" placeholder="name@example.com" disabled={isLoading} {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" placeholder="Your password" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
              {isLoading && <Spinner />}
              {isLoading ? "Opening workspace…" : "Open workspace"}
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Try a demo account. Each one fills the shared demo password.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {demoRoles.map((role) => {
            const item = roleMeta[role];
            const Icon = item.icon;
            return (
              <button
                key={role}
                type="button"
                onClick={() => fillDemoAccount(role)}
                className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-xs outline-none transition-[color,border-color,transform] duration-(--duration-quick) hover:border-input hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/35 active:scale-[0.97]"
              >
                <Icon className={cn("size-3.5", suiteMeta[item.suite].classes.text)} />
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
