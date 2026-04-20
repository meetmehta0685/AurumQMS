"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BriefcaseMedical,
  FlaskConical,
  Shield,
  ArrowLeft,
  ConciergeBell,
  Lock,
  Mail,
  Stethoscope,
  User,
  Users,
  UserCog,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roles = [
  { value: "patient", label: "Patient", icon: Users },
  { value: "doctor", label: "Doctor", icon: Stethoscope },
  { value: "admin", label: "Admin", icon: Shield },
  { value: "guest", label: "Guest", icon: ConciergeBell },
  { value: "staff", label: "Staff", icon: UserCog },
  { value: "lab", label: "Lab", icon: FlaskConical },
  { value: "pharma", label: "Pharma", icon: BriefcaseMedical },
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

      toast.success(
        "Registration successful! Please check your email to verify your account.",
      );
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
                Role-based access
              </Badge>
              <div className="space-y-3">
                <CardTitle className="font-display text-4xl">
                  Create account
                </CardTitle>
                <CardDescription className="text-base">
                  Register once and route into the correct workspace based on
                  your role.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Choose the role that matches your access needs.</p>
              <p>
                You will be routed to the matching workspace after verification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>
                Create credentials and choose the role for this account.
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
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="size-4 text-primary" />
                          Full name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
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

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select role</FormLabel>
                        <Tabs
                          value={selectedRole}
                          onValueChange={field.onChange}
                          className="w-full"
                        >
                          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 md:grid-cols-3 lg:grid-cols-4">
                            {roles.map((role) => {
                              const Icon = role.icon;

                              return (
                                <TabsTrigger
                                  key={role.value}
                                  value={role.value}
                                  className="h-auto justify-start gap-2 rounded-md border px-3 py-2 text-left"
                                  disabled={isLoading}
                                >
                                  <Icon className="size-4" />
                                  {role.label}
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </Tabs>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </Form>

              <p className="mt-6 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
