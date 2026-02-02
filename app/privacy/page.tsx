import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">Privacy Policy</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-sm border p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 15, 2026</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <p className="text-muted-foreground leading-relaxed">
                At HealthCare, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our healthcare queue management 
                platform. Please read this policy carefully to understand our practices regarding your 
                personal data.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Information We Collect</h2>
              </div>
              <div className="pl-13 space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Name, email address, and contact information</li>
                    <li>Date of birth and gender</li>
                    <li>Medical history and health-related information</li>
                    <li>Appointment history and preferences</li>
                    <li>Insurance information (if applicable)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>IP address and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Usage data and interaction patterns</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">How We Use Your Information</h2>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-13">
                <li>To provide and maintain our healthcare queue management services</li>
                <li>To schedule and manage your medical appointments</li>
                <li>To communicate with you about appointments, updates, and support</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal obligations and healthcare regulations</li>
                <li>To protect against fraudulent or unauthorized activity</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Data Security</h2>
              </div>
              <p className="text-muted-foreground pl-13">
                We implement industry-standard security measures to protect your personal and health 
                information. This includes encryption in transit and at rest, secure access controls, 
                regular security audits, and compliance with healthcare data protection standards. 
                However, no method of transmission over the Internet is 100% secure, and we cannot 
                guarantee absolute security.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Data Sharing</h2>
              </div>
              <div className="pl-13 space-y-3 text-muted-foreground">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Healthcare providers involved in your care</li>
                  <li>Service providers who assist in operating our platform</li>
                  <li>Legal authorities when required by law</li>
                  <li>Business partners with your explicit consent</li>
                </ul>
                <p className="font-medium text-foreground">
                  We do not sell your personal information to third parties.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Your Rights</h2>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-13">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability where applicable</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Cookies & Tracking</h2>
              </div>
              <p className="text-muted-foreground pl-13">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                and provide personalized content. You can manage cookie preferences through your browser 
                settings. Disabling cookies may affect some features of our platform.
              </p>
            </section>

            {/* Contact */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Contact Us</h2>
              </div>
              <div className="pl-13 text-muted-foreground">
                <p className="mb-3">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:privacy@healthcare.com" className="text-primary hover:underline">privacy@healthcare.com</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@healthcare.com" className="text-primary hover:underline">support@healthcare.com</a></p>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section className="border-t pt-8">
              <p className="text-muted-foreground text-sm">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage 
                you to review this Privacy Policy periodically for any changes.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 HealthCare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
