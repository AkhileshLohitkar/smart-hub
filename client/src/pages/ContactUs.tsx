import { Link } from "wouter";
import { ArrowLeft, Mail, MessageSquare, Clock } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/ui/card";

export default function ContactUs() {
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

        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4" data-testid="heading-contact">Contact Us</h1>
        <p className="text-muted-foreground text-lg mb-10">
          We are here to help. Reach out to us with any questions, feedback, or support requests.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center" data-testid="card-email">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold mb-2">Email Us</h3>
            <a href="mailto:hi@qikworksheet.in" className="text-sm text-primary hover:underline">
              hi@qikworksheet.in
            </a>
          </Card>

          <Card className="p-6 text-center" data-testid="card-response">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white mx-auto mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold mb-2">Response Time</h3>
            <p className="text-sm text-muted-foreground">
              Within 24 hours on business days
            </p>
          </Card>

          <Card className="p-6 text-center" data-testid="card-feedback">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold mb-2">Feedback</h3>
            <p className="text-sm text-muted-foreground">
              We value your suggestions and ideas
            </p>
          </Card>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <h2 className="text-xl font-display font-bold">Frequently Asked Questions</h2>

          <h3 className="text-lg font-semibold mt-4">How do I generate a worksheet?</h3>
          <p>
            After logging in, go to the Dashboard. Select the grade, board, subject, and topic, then click "Generate Worksheet". Your worksheet will be ready in under a minute.
          </p>

          <h3 className="text-lg font-semibold mt-4">Can I use Qik Worksheets for multiple children?</h3>
          <p>
            Yes! With our Family plan, you can create profiles for 2-3 children and generate worksheets tailored to each child's grade and board. The No Watermark plan supports unlimited children.
          </p>

          <h3 className="text-lg font-semibold mt-4">Which education boards are supported?</h3>
          <p>
            We support CBSE, ICSE, IGCSE, State Board, and Common Core. For CBSE, we offer NCERT chapter-specific content aligned with the exact textbook.
          </p>

          <h3 className="text-lg font-semibold mt-4">How do I download a worksheet as PDF?</h3>
          <p>
            After generating a worksheet, click the "Download PDF" button on the worksheet view page. You can also print directly from your browser using the "Print" button.
          </p>

          <h3 className="text-lg font-semibold mt-4">What if I find an error in a generated worksheet?</h3>
          <p>
            While our AI strives for accuracy, we recommend reviewing all worksheets before use. You can rate worksheets to help us improve quality. If you find persistent issues, please contact us.
          </p>

          <h3 className="text-lg font-semibold mt-4">How do I request a refund?</h3>
          <p>
            Please refer to our <Link href="/refund-policy" className="text-primary hover:underline">Refund and Cancellation Policy</Link> for detailed information. You can request a refund within 7 days of purchase by emailing us.
          </p>
        </div>
      </div>
    </div>
  );
}
