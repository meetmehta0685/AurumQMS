'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth';
import Link from 'next/link';
import { Heart, Mail, Lock, User, Users, Stethoscope, Shield, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      role: 'patient',
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error('Registration failed');
        return;
      }

      // Create profile in database
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: authData.user.id,
        role: data.role,
        full_name: data.full_name,
        email: data.email,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails due to RLS, the user is still created
        // They can still proceed - profile will be created on first login via trigger
        if (profileError.code === '42501' || profileError.message?.includes('policy')) {
          console.warn('Profile creation blocked by RLS - this is expected if INSERT policy is missing');
          // Continue with registration success since auth user was created
        } else {
          toast.error(`Failed to create profile: ${profileError.message}`);
          return;
        }
      }

      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = form.watch('role');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Back to Home */}
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
      
      <Card className="w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Heart className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
            <CardDescription className="text-base mt-2">Register to access HealthCare platform</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        className="h-12 border-2 border-input focus:border-primary transition-colors"
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
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        className="h-12 border-2 border-input focus:border-primary transition-colors"
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
                    <FormLabel className="text-sm font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="h-12 border-2 border-input focus:border-primary transition-colors"
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
                    <FormLabel className="text-sm font-semibold">Select Role</FormLabel>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => field.onChange('patient')}
                        disabled={isLoading}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                          selectedRole === 'patient'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input hover:border-border text-muted-foreground'
                        }`}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-xs font-medium">Patient</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('doctor')}
                        disabled={isLoading}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                          selectedRole === 'doctor'
                            ? 'border-chart-1 bg-chart-1/10 text-chart-1'
                            : 'border-input hover:border-border text-muted-foreground'
                        }`}
                      >
                        <Stethoscope className="w-5 h-5" />
                        <span className="text-xs font-medium">Doctor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('admin')}
                        disabled={isLoading}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                          selectedRole === 'admin'
                            ? 'border-chart-2 bg-chart-2/10 text-chart-2'
                            : 'border-input hover:border-border text-muted-foreground'
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                        <span className="text-xs font-medium">Admin</span>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg text-base font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account?</span>{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
