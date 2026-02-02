import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Users, Building2, Clock, Heart, ArrowRight, Shield, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl text-foreground">HealthCare</span>
              <p className="text-xs text-muted-foreground">Hospital Management</p>
            </div>
          </Link>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-accent">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Modern Healthcare Platform
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Streamlined Hospital<br />Management System
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            A comprehensive digital platform connecting patients, doctors, and hospital administrators for seamless appointment booking, token generation, and patient care coordination.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register?role=patient">
              <Button size="lg" className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-xl h-14 px-8 text-lg">
                <Users className="w-5 h-5" />
                Book as Patient
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/register?role=doctor">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-2 border-border hover:border-primary hover:bg-accent h-14 px-8 text-lg">
                <Stethoscope className="w-5 h-5" />
                Register as Doctor
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="relative">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Patient Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative">
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Browse doctors by specialty</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Book appointments easily</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> View medical records</li>
                <li className="flex items-center gap-2"><span className="text-primary">✓</span> Track queue position</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-chart-1/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="relative">
              <div className="w-12 h-12 bg-chart-1 rounded-xl flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Doctor Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative">
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2"><span className="text-chart-1">✓</span> Manage appointments</li>
                <li className="flex items-center gap-2"><span className="text-chart-1">✓</span> Control token queue</li>
                <li className="flex items-center gap-2"><span className="text-chart-1">✓</span> Add prescriptions</li>
                <li className="flex items-center gap-2"><span className="text-chart-1">✓</span> Update availability</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-chart-2/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="relative">
              <div className="w-12 h-12 bg-chart-2 rounded-xl flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Admin Panel</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative">
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2"><span className="text-chart-2">✓</span> Manage doctors</li>
                <li className="flex items-center gap-2"><span className="text-chart-2">✓</span> Organize departments</li>
                <li className="flex items-center gap-2"><span className="text-chart-2">✓</span> View statistics</li>
                <li className="flex items-center gap-2"><span className="text-chart-2">✓</span> Generate reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-chart-3/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
            <CardHeader className="relative">
              <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Smart Queue System</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground relative">
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2"><span className="text-chart-3">✓</span> Auto token generation</li>
                <li className="flex items-center gap-2"><span className="text-chart-3">✓</span> Real-time updates</li>
                <li className="flex items-center gap-2"><span className="text-chart-3">✓</span> Wait time estimates</li>
                <li className="flex items-center gap-2"><span className="text-chart-3">✓</span> Queue management</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl mb-20 border border-border">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">Simple Process</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform">
                  1
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-chart-1 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-3 text-foreground">Patient Registration</h4>
              <p className="text-muted-foreground leading-relaxed">
                Create an account and complete your profile with health information
              </p>
            </div>
            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform">
                  2
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-chart-1 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-3 text-foreground">Book Appointment</h4>
              <p className="text-muted-foreground leading-relaxed">
                Browse doctors, select specialization, and choose available slots
              </p>
            </div>
            <div className="text-center group">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl group-hover:scale-110 transition-transform">
                  3
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-chart-1 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              </div>
              <h4 className="font-bold text-lg mb-3 text-foreground">Get Token & Queue</h4>
              <p className="text-muted-foreground leading-relaxed">
                Receive auto-generated token and monitor your position in queue
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary rounded-3xl p-8 md:p-12 text-primary-foreground text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
          <div className="relative">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of patients and healthcare providers using our platform for better healthcare management
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="shadow-xl h-14 px-8 text-lg font-semibold w-full sm:w-auto">
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground hover:text-primary h-14 px-8 text-lg w-full sm:w-auto transition-all">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-md mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">HealthCare</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
              <a href="mailto:support@healthcare.com" className="text-muted-foreground hover:text-primary transition-colors">
                support@healthcare.com
              </a>
              <span className="hidden md:inline text-border">|</span>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">&copy; 2026 HealthCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
