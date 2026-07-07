import { Link } from "wouter";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import instagramLogo from "@assets/instagram-logo.png";

const INSTAGRAM_HANDLE = "qikworksheet";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}`;
const YOUTUBE_URL = "https://www.youtube.com/channel/UCR_PA8wwecGSPVo8LKLhbCw";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61577472398170";

const footerLinkClassName =
  "text-sm text-muted-foreground hover:text-foreground transition-colors";

const footerLinkGroupClassName =
  "text-sm text-muted-foreground group-hover:text-foreground transition-colors";

export default function Footer() {
  return (
    <footer className="site-footer py-12 px-4 border-t border-border/50 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
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
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-faq"
                >
                  FAQs
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
                  className={footerLinkClassName}
                  data-testid="footer-email"
                >
                  hi@qikworksheet.in
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm mb-4 text-foreground">
              Follow Us On            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-instagram"
                  aria-label={`Follow ${INSTAGRAM_HANDLE} on Instagram`}
                  className="group inline-flex items-center gap-2"
                >
                  <img
                    src={instagramLogo}
                    alt=""
                    aria-hidden
                    className="h-5 w-5 shrink-0 rounded-full object-cover bg-transparent"
                  />
                  <span className={footerLinkGroupClassName}>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-youtube"
                  aria-label="Follow Qik Worksheets on YouTube"
                  className="group inline-flex items-center gap-2"
                >
                  <FaYoutube
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-[#FF0000]"
                  />
                  <span className={footerLinkGroupClassName}>YouTube</span>
                </a>
              </li>
              <li>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="footer-facebook"
                  aria-label="Follow Qik Worksheets on Facebook"
                  className="group inline-flex items-center gap-2"
                >
                  <FaFacebook
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-[#1877F2]"
                  />
                  <span className={footerLinkGroupClassName}>Facebook</span>
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
