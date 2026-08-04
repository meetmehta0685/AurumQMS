"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, ArrowLeft, CheckCircle2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { roleMeta, suiteMeta } from "@/components/layout/role-config";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { createClient } from "@/lib/supabase/client";
import { SELF_SERVICE_ROLES } from "@/lib/auth/roles";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import type { UserRole } from "@/types";

const roleOrder: UserRole[] = [
  "patient",
  "doctor",
  "admin",
  "lab",
  "pharma",
  "guest",
  "staff",
];

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
      const role = SELF_SERVICE_ROLES.includes(data.role) ? data.role : "patient";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { data: { full_name: data.full_name, role } },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }
      if (!authData.user) {
        toast.error("Registration failed. Try again.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        role,
        full_name: data.full_name,
        email: data.email,
      });

      if (
        profileError &&
        profileError.code !== "42501" &&
        !profileError.message?.includes("policy")
      ) {
        toast.error(`Profile setup failed: ${profileError.message}`);
        return;
      }

      toast.success("Account created. Sign in to continue.");
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
            <Activity />
            Self-service onboarding
          </Badge>
          <div className="flex flex-col gap-4">
            <h1 className="max-w-xl font-display text-4xl tracking-[-0.03em] sm:text-5xl">
              Start with the work you own.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Choose a role and AURUM QMS will route you to a workspace
              built around that responsibility.
            </p>
          </div>
          <ul className="flex max-w-xl flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="text-care" />
              Clear role-based navigation after sign-in
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="text-care" />
              Shared status language across every workflow
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="text-care" />
              Responsive web access for the shift in front of you
            </li>
          </ul>
        </section>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-3xl tracking-tight">Create your account</CardTitle>
            <CardDescription>
              Select the workspace that matches your role, then add your details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UserRound className="size-4 text-muted-foreground" />
                        Full name
                      </FormLabel>
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
                          className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
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
                                className="h-auto justify-start gap-2 px-3 py-2.5 text-left"
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
                  {isLoading ? <Spinner data-icon="inline-start" /> : <Activity data-icon="inline-start" />}
                  {isLoading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </Form>
            <Separator className="my-6" />
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.main>
    </div>
  );
}
