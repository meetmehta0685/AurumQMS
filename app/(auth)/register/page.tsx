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
  CheckCircle2,
  ConciergeBell,
  FlaskConical,
  Heart,
  Lock,
  Mail,
  Pill,
  Shield,
  Stethoscope,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { SELF_SERVICE_ROLES } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
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

const roles = [
  { value: "patient", label: "Patient", icon: Heart, badge: "Healthcare" },
  { value: "doctor", label: "Doctor", icon: Stethoscope, badge: "Clinical" },
  { value: "admin", label: "Admin", icon: Shield, badge: "Management" },
  { value: "lab", label: "Lab Tech", icon: FlaskConical, badge: "Diagnostics" },
  { value: "pharma", label: "Pharmacist", icon: Pill, badge: "Dispensary" },
  { value: "guest", label: "Guest", icon: ConciergeBell, badge: "Hospitality" },
  { value: "staff", label: "Staff", icon: Bed, badge: "Operations" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      role: "patient",
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      const role = SELF_SERVICE_ROLES.includes(data.role)
        ? data.role
        : "patient";

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Registration failed");
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
        toast.error(`Failed to create profile: ${profileError.message}`);
        return;
      }

      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = form.watch("role");

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background ambient light */}
      <div className="absolute top-10 right-10 size-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 size-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Info Card */}
          <Card className="lg:col-span-5 glass-panel border-primary/20 flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Activity className="size-6" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                Self-Service Onboarding
              </Badge>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Create Your Workspace Role Account
              </h2>
              <p className="text-sm text-muted-foreground">
                Registering creates a dedicated user profile mapped directly to your operational workspace role.
              </p>
            </div>

            <div className="space-y-2 pt-6 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>Instant routing after login</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>Encrypted Supabase Authentication</span>
              </div>
            </div>
          </Card>

          {/* Right Form Card */}
          <Card className="lg:col-span-7 glass-card border-border/60 shadow-2xl p-6 sm:p-8">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="font-display text-2xl font-bold">Register Account</CardTitle>
              <CardDescription>
                Select your account role and enter your registration details.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-xs font-semibold">
                          <User className="size-3.5 text-primary" />
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dr. Sarah Connor"
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
                            placeholder="sarah@aurum.com"
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

                  {/* Role Selector Grid */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-semibold">Select Account Role</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {roles.map((r) => {
                            const RIcon = r.icon;
                            const isSelected = selectedRole === r.value;
                            return (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => field.onChange(r.value)}
                                disabled={isLoading}
                                className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/10 font-semibold shadow-xs"
                                    : "border-border/50 bg-background/40 hover:border-border hover:bg-accent/50 text-muted-foreground"
                                }`}
                              >
                                <RIcon className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                <div className="leading-none">
                                  <p className="text-xs font-medium text-foreground">{r.label}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full shadow-lg shadow-primary/20 gap-2 mt-4" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Activity className="size-4 animate-spin" /> Registering Account...
                      </span>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
