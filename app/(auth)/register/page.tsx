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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createClient } from "@/lib/supabase/client";
import { resolveRoleHomeRoute, SELF_SERVICE_ROLES } from "@/lib/auth/roles";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import type { UserRole } from "@/types";

const roleOrder: UserRole[] = [...SELF_SERVICE_ROLES];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", full_name: "", role: "patient" },
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name, role: data.role } },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }
      if (!authData.user) {
        toast.error("Registration failed. Try again.");
        return;
      }

      // With email confirmation off, signUp returns an active session.
      if (authData.session) {
        toast.success("Account created. Opening your workspace.");
        router.push(resolveRoleHomeRoute(data.role));
        router.refresh();
        return;
      }

      toast.success("Account created. Check your email to confirm, then sign in.");
      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("We could not create your account. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = form.watch("role") as UserRole;

  return (
    <div className="t-rise flex w-full max-w-[440px] flex-col gap-7">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Patients and hotel guests sign up here. Clinical and staff accounts
          are created by an administrator.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-md sm:p-7">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" disabled={isLoading} {...field} />
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
                    <Input type="password" placeholder="Create a password" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-3">
                  <FormLabel>Workspace role</FormLabel>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={selectedRole}
                      onValueChange={(value) => {
                        if (value) field.onChange(value);
                      }}
                      variant="outline"
                      spacing={1}
                      disabled={isLoading}
                      className="grid w-full grid-cols-2 gap-2"
                      aria-label="Choose a workspace role"
                    >
                      {roleOrder.map((role) => {
                        const item = roleMeta[role];
                        const Icon = item.icon;
                        const suite = suiteMeta[item.suite];
                        return (
                          <ToggleGroupItem
                            key={role}
                            value={role}
                            aria-label={item.label}
                            className="h-auto justify-start gap-2.5 rounded-xl px-3.5 py-3 text-left data-[state=on]:border-primary/50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                          >
                            <Icon />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-sm">{item.shortLabel}</span>
                              <span className="truncate text-[11px] text-muted-foreground">
                                {suite.label.replace(" Operations", "")}
                              </span>
                            </span>
                          </ToggleGroupItem>
                        );
                      })}
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
              {isLoading && <Spinner />}
              {isLoading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
