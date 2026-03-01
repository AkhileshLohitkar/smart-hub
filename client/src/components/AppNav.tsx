import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, LogOut, User, FileText, Users, ClipboardList, Home as HomeIcon, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  starter_annual: "Starter",
  family: "Family",
  family_annual: "Family",
  no_watermark: "Premium",
};

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  testId: string;
}

interface AppNavProps {
  user: {
    name: string;
    plan: string;
  };
  onLogout: () => void;
  activeLinks?: NavLink[];
  showPlanBadge?: boolean;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className="w-4 h-4" />, testId: "link-dashboard" },
  { href: "/children", label: "My Children", icon: <Users className="w-4 h-4" />, testId: "link-my-children" },
  { href: "/history", label: "My Worksheets", icon: <FileText className="w-4 h-4" />, testId: "link-my-worksheets" },
  { href: "/test-prep", label: "Test Prep", icon: <ClipboardList className="w-4 h-4" />, testId: "link-test-prep" },
];

export function AppNav({ user, onLogout, activeLinks, showPlanBadge = true }: AppNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = activeLinks || DEFAULT_LINKS;

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src={logoImage} alt="Qik Worksheet" className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg object-contain drop-shadow-md logo-vibrant" data-testid="logo-image" />
          <span className="text-lg sm:text-xl font-display font-bold text-gradient-primary hidden sm:inline" data-testid="logo-text">Qik Worksheets</span>
        </Link>

        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm" data-testid={link.testId} className="text-xs lg:text-sm">
                {link.icon}
                <span className="ml-1">{link.label}</span>
              </Button>
            </Link>
          ))}
          {user.plan !== "free" && (
            <Link href="/#pricing">
              <Button variant="ghost" size="sm" data-testid="button-manage-subscription" className="text-xs lg:text-sm">
                <CreditCard className="w-4 h-4 mr-1" />
                My Plan
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span data-testid="text-username" className="max-w-[100px] truncate">{user.name}</span>
            {showPlanBadge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-primary text-white font-medium" data-testid="text-plan">
                {PLAN_LABELS[user.plan] || user.plan}
              </span>
            )}
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
            className="h-9 w-9"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-border/50 pb-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate" data-testid="text-username-mobile">{user.name}</span>
              {showPlanBadge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-primary text-white font-medium">
                  {PLAN_LABELS[user.plan] || user.plan}
                </span>
              )}
            </div>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  data-testid={`${link.testId}-mobile`}
                >
                  {link.icon}
                  {link.label}
                </button>
              </Link>
            ))}
            {user.plan !== "free" && (
              <Link href="/#pricing">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  data-testid="button-manage-subscription-mobile"
                >
                  <CreditCard className="w-4 h-4" />
                  My Plan
                </button>
              </Link>
            )}
            <div className="border-t border-border/50 pt-2 mt-2">
              <button
                onClick={() => { onLogout(); setMobileOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                data-testid="button-logout-mobile"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
