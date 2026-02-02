import Link from "next/link";
import { ArrowLeft, ScrollText, CheckCircle, AlertTriangle, Scale, CreditCard, Ban, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
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
            <ScrollText className="w-5 h-5 text-primary" />
            <span className="font-semibold">Terms of Service</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-card rounded-2xl shadow-sm border p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 15, 2026</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to HealthCare. These Terms of Service (&quot;Terms&quot;) govern your use of our healthcare 
                queue management platform and services. By accessing or using our platform, you agree to 
                be bound by these Terms. If you do not agree to these Terms, please do not use our services.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Acceptance of Terms</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <p>By using HealthCare, you acknowledge that you:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Are at least 18 years of age or have parental/guardian consent</li>
                  <li>Have the legal capacity to enter into a binding agreement</li>
                  <li>Will use the platform in compliance with all applicable laws</li>
                  <li>Have read and understood our Privacy Policy</li>
                </ul>
              </div>
            </section>

            {/* Description of Services */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Description of Services</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <p>HealthCare provides a healthcare queue management system that enables:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Online appointment booking and management</li>
                  <li>Real-time queue tracking and notifications</li>
                  <li>Digital patient records management</li>
                  <li>Communication between patients and healthcare providers</li>
                  <li>Administrative tools for healthcare facilities</li>
                </ul>
                <p className="mt-4 font-medium text-foreground">
                  Note: HealthCare is a management platform and does not provide medical advice, 
                  diagnosis, or treatment.
                </p>
              </div>
            </section>

            {/* User Accounts */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">User Accounts & Responsibilities</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <p>When creating an account, you agree to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Not share your account with others</li>
                </ul>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Ban className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Prohibited Activities</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <p>You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use the platform for any unlawful purpose</li>
                  <li>Impersonate another person or entity</li>
                  <li>Interfere with or disrupt the platform&apos;s operation</li>
                  <li>Attempt to gain unauthorized access to any systems</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Scrape, harvest, or collect user data without consent</li>
                  <li>Use the platform for spam or unsolicited communications</li>
                  <li>Violate any applicable healthcare regulations</li>
                </ul>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Payment & Subscription</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <ul className="list-disc list-inside space-y-1">
                  <li>Subscription fees are billed in advance on a recurring basis</li>
                  <li>All fees are non-refundable unless otherwise stated</li>
                  <li>We reserve the right to modify pricing with 30 days notice</li>
                  <li>Failure to pay may result in suspension of services</li>
                  <li>You are responsible for any applicable taxes</li>
                </ul>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Disclaimers & Limitations</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <p className="font-medium text-foreground mb-2">Medical Disclaimer</p>
                  <p className="text-sm">
                    HealthCare is not a substitute for professional medical advice, diagnosis, or treatment. 
                    Always seek the advice of qualified healthcare providers with any questions regarding 
                    medical conditions.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-1 mt-4">
                  <li>Services are provided &quot;as is&quot; without warranties of any kind</li>
                  <li>We do not guarantee uninterrupted or error-free service</li>
                  <li>We are not liable for any indirect or consequential damages</li>
                  <li>Our total liability is limited to fees paid in the past 12 months</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Termination</h2>
              </div>
              <div className="pl-13 text-muted-foreground space-y-3">
                <ul className="list-disc list-inside space-y-1">
                  <li>You may terminate your account at any time</li>
                  <li>We may suspend or terminate accounts for Terms violations</li>
                  <li>Upon termination, your right to use the platform ceases</li>
                  <li>We may retain certain data as required by law</li>
                  <li>Provisions that should survive termination will remain in effect</li>
                </ul>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Governing Law</h2>
              </div>
              <p className="text-muted-foreground pl-13">
                These Terms shall be governed by and construed in accordance with applicable laws. 
                Any disputes arising from these Terms or your use of the platform shall be resolved 
                through binding arbitration or in the courts of competent jurisdiction.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground m-0">Changes to Terms</h2>
              </div>
              <p className="text-muted-foreground pl-13">
                We reserve the right to modify these Terms at any time. We will provide notice of 
                material changes via email or through the platform. Your continued use of the 
                platform after changes constitutes acceptance of the modified Terms.
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
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:legal@healthcare.com" className="text-primary hover:underline">legal@healthcare.com</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@healthcare.com" className="text-primary hover:underline">support@healthcare.com</a></p>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t pt-8">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  By using HealthCare, you acknowledge that you have read, understood, and agree to 
                  be bound by these Terms of Service and our Privacy Policy.
                </p>
              </div>
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
