import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, LogOut, FileText, ClipboardList, Home as HomeIcon, CreditCard, BookOpen, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileMenuDropdown, type ProfileMenuUser } from "@/components/ProfileMenuDropdown";
import { getProfilePlanInfo } from "@/lib/profilePlanInfo";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  testId: string;
}

interface AppNavProps {
  user: ProfileMenuUser;
  onLogout: () => void;
  activeLinks?: NavLink[];
  showPlanBadge?: boolean;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: "/new-worksheet", label: "New Worksheet", icon: <HomeIcon className="w-4 h-4" />, testId: "link-dashboard" },
  { href: "/test-prep", label: "Test Prep", icon: <ClipboardList className="w-4 h-4" />, testId: "link-test-prep" },
  { href: "/my-notes", label: "My Notes", icon: <BookOpen className="w-4 h-4" />, testId: "link-my-notes" },
  { href: "/history", label: "My Worksheets", icon: <FileText className="w-4 h-4" />, testId: "link-my-worksheets" },
  { href: "/brain-flex", label: "Brain Flex", icon: <Brain className="w-4 h-4" />, testId: "link-brain-flex" },
];

export function AppNav({ user, onLogout, activeLinks, showPlanBadge = true }: AppNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = activeLinks || DEFAULT_LINKS;
  const planInfo = getProfilePlanInfo(user);

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 no-print">
      <div className="flex items-center w-full max-w-[93rem] mx-auto px-6 h-14 sm:h-16 gap-3">
        {/* LEFT: logo */}
        <div className="flex flex-1 items-center justify-start min-w-0">
          <Link href="/new-worksheet" className="flex items-center gap-2 shrink-0">
            <img
              src={logoImage}
              alt="Qik Worksheets"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-contain drop-shadow-md logo-vibrant"
              data-testid="logo-image"
            />
            <span className="text-sm sm:text-base font-display font-bold text-gradient-primary whitespace-nowrap" data-testid="logo-text">
              Qik Worksheets
            </span>
          </Link>
        </div>

        {/* CENTER: navigation (desktop) */}
        <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 shrink-0 whitespace-nowrap text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                size="sm"
                data-testid={link.testId}
                className="text-xs font-medium px-3 h-9"
              >
                {link.icon}
                <span className="ml-1 hidden lg:inline">{link.label}</span>
              </Button>
            </Link>
          ))}
          <Link href="/pricing">
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-manage-subscription"
              className="text-xs font-medium px-3 h-9"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">View Plans</span>
            </Button>
          </Link>
        </div>

        {/* RIGHT: theme + profile (desktop) / mobile menu */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <ProfileMenuDropdown
              user={user}
              onLogout={onLogout}
              showPlanBadge={showPlanBadge}
            />
          </div>
          <div className="flex md:hidden items-center gap-1">
            <ProfileMenuDropdown
              user={user}
              onLogout={onLogout}
              showPlanBadge={false}
              variant="compact"
            />
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
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <div className="px-3 py-3 mb-2 border-b border-border/50 space-y-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" data-testid="text-username-mobile">
                  {user.name}
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
              {showPlanBadge && (
                <div className="rounded-lg border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-2.5 text-xs space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{planInfo.displayName}</span>
                  </div>
                  {planInfo.expiresLabel && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Expires</span>
                      <span>{planInfo.expiresLabel}</span>
                    </div>
                  )}
                </div>
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
            <Link href="/pricing">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  data-testid="button-manage-subscription-mobile"
                >
                  <CreditCard className="w-4 h-4" />
                  View Plans
                </button>
              </Link>
            <div className="border-t border-border/50 pt-2 mt-2">
              <button
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
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
