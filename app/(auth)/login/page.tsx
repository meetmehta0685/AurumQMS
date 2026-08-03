"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  ArrowLeft,
  Bed,
  ConciergeBell,
  FlaskConical,
  Heart,
  Lock,
  Mail,
  Pill,
  Shield,
  Sparkles,
  Stethoscope,
} from "lucide-react";
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

const demoAccounts = [
  { role: "Patient", email: "patient@demo.com", icon: Heart, badge: "Teal" },
  { role: "Doctor", email: "doctor@demo.com", icon: Stethoscope, badge: "Indigo" },
  { role: "Admin", email: "admin@demo.com", icon: Shield, badge: "Purple" },
  { role: "Lab", email: "lab@demo.com", icon: FlaskConical, badge: "Cyan" },
  { role: "Pharma", email: "pharma@demo.com", icon: Pill, badge: "Amber" },
  { role: "Guest", email: "guest@demo.com", icon: ConciergeBell, badge: "Rose" },
  { role: "Staff", email: "staff@demo.com", icon: Bed, badge: "Emerald" },
];

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

  const fillDemoAccount = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", "password123");
    toast.info(`Filled credentials for ${email}`);
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

      toast.success("Welcome back! Redirecting...");
      router.push(resolveRoleHomeRoute(resolvedRole));
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-10 size-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 size-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Side Info & Demo Shortcuts */}
          <Card className="lg:col-span-5 glass-panel border-primary/20 flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Activity className="size-6" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                Enterprise Access
              </Badge>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Aurum Enterprise Workspace
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to access your healthcare OPD queue manager, clinical workstation, laboratory portal, pharmacy dispensary, or hospitality suite.
              </p>
            </div>

            <div className="space-y-3 pt-6 border-t border-border/40">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Quick Fill Demo Presets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {demoAccounts.map((acc) => {
                  const AccIcon = acc.icon;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemoAccount(acc.email)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-all hover:scale-105"
                    >
                      <AccIcon className="size-3 text-primary" />
                      <span>{acc.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Right Side Form */}
          <Card className="lg:col-span-7 glass-card border-border/60 shadow-2xl p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="font-display text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your registered credentials to enter your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-xs font-semibold">
                          <Mail className="size-3.5 text-primary" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@aurum.com"
                            className="bg-background/50"
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
                        <FormLabel className="flex items-center gap-2 text-xs font-semibold">
                          <Lock className="size-3.5 text-primary" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-background/50"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full shadow-lg shadow-primary/20 gap-2 mt-2" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Activity className="size-4 animate-spin" /> Authenticating...
                      </span>
                    ) : (
                      "Sign In to Workspace"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
                Don&apos;t have an account yet?{" "}
                <Link href="/register" className="font-semibold text-primary hover:underline">
                  Create self-service account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
