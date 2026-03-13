import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Qik Worksheet" className="w-20 h-20 rounded-lg object-contain drop-shadow-md logo-vibrant" />
            <span className="text-lg font-display font-bold text-gradient-primary">Qik Worksheets</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2" data-testid="heading-privacy">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <p>
            At Qik Worksheets, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">1. Information We Collect</h2>
          <h3 className="text-lg font-semibold mt-4">Personal Information</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account details:</strong> Name, email address, and password when you register.</li>
            <li><strong>Child profiles:</strong> Child's name, grade/class, and education board (provided voluntarily by you).</li>
            <li><strong>Payment information:</strong> Processed securely through Razorpay. We do not store your card details.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4">Usage Information</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Worksheets generated (subject, topic, grade, board, difficulty).</li>
            <li>Worksheet ratings and interaction data.</li>
            <li>Login timestamps and session information.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>To provide and improve our worksheet generation services.</li>
            <li>To manage your account and subscription.</li>
            <li>To personalize your experience based on child profiles.</li>
            <li>To process payments securely.</li>
            <li>To communicate important updates about the service.</li>
            <li>To analyze usage patterns and improve our AI models.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">3. Data Storage and Security</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your data is stored securely on encrypted servers.</li>
            <li>Passwords are hashed using industry-standard algorithms (bcrypt).</li>
            <li>We use HTTPS encryption for all data transmission.</li>
            <li>Payment processing is handled by Razorpay, a PCI-DSS compliant payment gateway.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">4. Data Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Payment processors:</strong> Razorpay, for processing your subscription payments.</li>
            <li><strong>AI services:</strong> OpenAI, for generating worksheet content (only subject/topic data is shared, not personal information).</li>
            <li><strong>Legal authorities:</strong> When required by law or to protect our rights.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">5. Children's Privacy</h2>
          <p>
            Our service is designed for use by parents and teachers. Child profiles are created and managed by adult users. We do not knowingly collect personal information directly from children under 13. The child profile data (name, grade, board) is minimal and used solely for customizing worksheet generation.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">6. Cookies</h2>
          <p>
            We use session cookies to keep you logged in and maintain your preferences (such as dark mode settings). These cookies are essential for the functioning of the service and are not used for tracking or advertising purposes.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent for data processing at any time.</li>
            <li>Export your data in a portable format.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">8. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active. Generated worksheets are stored for your convenience and can be accessed through your history. If you delete your account, your personal data will be removed within 30 days.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the platform. Your continued use of the service after changes constitutes acceptance.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or your data, please contact us at <a href="mailto:hi@qikworksheet.in" className="text-primary hover:underline">hi@qikworksheet.in</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
