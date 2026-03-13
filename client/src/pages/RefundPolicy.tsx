import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RefundPolicy() {
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

        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2" data-testid="heading-refund">Refund and Cancellation Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <p>
            We want you to be completely satisfied with your Qik Worksheets subscription. Please read our refund and cancellation policy carefully before making a purchase.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">1. Free Plan</h2>
          <p>
            The Free plan does not involve any payment and therefore no refund is applicable. You can use the free plan with its included features at no cost.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">2. Paid Subscriptions</h2>
          <p>All paid subscriptions (Starter, Family, No Watermark) are subject to the following refund terms:</p>

          <h3 className="text-lg font-semibold mt-4">Eligibility for Refund</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Within 7 days:</strong> If you are not satisfied with the service, you may request a full refund within 7 days of purchase, provided you have not generated more than 10 worksheets using the paid plan.</li>
            <li><strong>After 7 days:</strong> No refunds will be issued after 7 days from the date of purchase.</li>
            <li><strong>Technical issues:</strong> If you experience persistent technical issues that prevent you from using the service, and we are unable to resolve them within 48 hours of your support request, you are eligible for a full refund regardless of the 7-day window.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-4">Non-Refundable Cases</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Dissatisfaction with AI-generated content quality after having used the service beyond the 7-day/10-worksheet threshold.</li>
            <li>Failure to use the service during the subscription period (non-usage does not qualify for a refund).</li>
            <li>Violation of Terms and Conditions leading to account suspension.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">3. How to Request a Refund</h2>
          <p>To request a refund, please follow these steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Send an email to <a href="mailto:hi@qikworksheet.in" className="text-primary hover:underline">hi@qikworksheet.in</a> with the subject line "Refund Request".</li>
            <li>Include your registered email address and the reason for your refund request.</li>
            <li>Our team will review your request and respond within 3 business days.</li>
          </ol>

          <h2 className="text-xl font-display font-bold mt-8">4. Refund Processing</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Approved refunds will be processed within 5-7 business days.</li>
            <li>Refunds will be credited to the original payment method used during purchase.</li>
            <li>Razorpay processing fees (if any) are non-refundable.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">5. Cancellation</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Subscriptions do not auto-renew. Your plan simply expires at the end of the subscription period.</li>
            <li>You can continue to use the service until your subscription period ends.</li>
            <li>After expiry, your account reverts to the Free plan with its limitations.</li>
            <li>Your previously generated worksheets remain accessible even after the plan expires.</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">6. Plan Downgrades</h2>
          <p>
            If you are on a Family plan and downgrade to a Starter plan, child profiles exceeding the new plan's limit will not be deleted but you will not be able to add new ones. All previously generated worksheets remain accessible.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">7. Contact Us</h2>
          <p>
            For any questions about refunds, cancellations, or billing, please reach out to us at <a href="mailto:hi@qikworksheet.in" className="text-primary hover:underline">hi@qikworksheet.in</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
