"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { roleMeta, suiteMeta } from "@/components/layout/role-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
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
    <div className="min-h-screen bg-background">
      <motion.header
        className="border-b bg-surface"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">
              AURUM QMS
            </span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" />
              Back to home
            </Link>
          </Button>
        </div>
      </motion.header>

      <motion.main
        className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-16"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <section className="flex flex-col gap-6 pt-2">
          <Badge variant="outline" className="w-fit gap-2 border-care/30 bg-care/10 text-care">
            <ShieldCheck />
            Role-aware access
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-xl font-display text-4xl tracking-[-0.03em] sm:text-5xl">
              Enter the work that is yours.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Sign in to continue with the appointments, queues, records,
              diagnostics, rooms, or guest requests assigned to your role.
            </p>
          </div>
          <Alert className="max-w-xl bg-card">
            <CheckCircle2 />
            <AlertTitle>One account, one clear workspace</AlertTitle>
            <AlertDescription>
              Your role determines the navigation, status language, and actions
              you see after sign-in.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3 pt-3">
            <p className="text-sm font-medium">Demo shortcuts</p>
            <div className="flex flex-wrap gap-2">
              {demoRoles.map((role) => {
                const item = roleMeta[role];
                const Icon = item.icon;
                const suite = suiteMeta[item.suite];
                return (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoAccount(role)}
                    className="gap-2"
                  >
                    <Icon data-icon="inline-start" />
                    {item.shortLabel}
                    <span className={cn("size-1.5 rounded-full", suite.classes.solid)} />
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Demo shortcuts fill the form with the role email and the shared
              demo password.
            </p>
          </div>
        </section>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-3xl tracking-tight">Sign in</CardTitle>
            <CardDescription>
              Use your registered email and password to open your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" />
                        Email address
                      </FormLabel>
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
                      <FormLabel className="flex items-center gap-2">
                        <LockKeyhole className="size-4 text-muted-foreground" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
                  {isLoading ? <Spinner data-icon="inline-start" /> : <Activity data-icon="inline-start" />}
                  {isLoading ? "Opening workspace…" : "Open workspace"}
                </Button>
              </form>
            </Form>
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                Create a role account
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
}
