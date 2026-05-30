import { Link } from "wouter";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";

export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border/50 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src={logoImage}
                alt="Qik Worksheet"
                className="w-20 h-20 rounded-md object-contain drop-shadow-md logo-vibrant"
              />
              <span className="font-display font-bold text-gradient-primary">
                Qik Worksheets
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered educational worksheet generator for CBSE and State Board.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-about"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-contact"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-pricing"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-foreground">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-terms"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-privacy"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-refund"
                >
                  Refund & Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-foreground">
              Get in Touch
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:hi@qikworksheet.in"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-email"
                >
                  hi@qikworksheet.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Qik Worksheets. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/refund-policy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

