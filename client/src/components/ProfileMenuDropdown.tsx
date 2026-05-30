import { Link } from "wouter";
import { ChevronDown, CreditCard, LogOut, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfilePlanInfo } from "@/lib/profilePlanInfo";
import { cn } from "@/lib/utils";

export type ProfileMenuUser = {
  name: string;
  email?: string;
  plan: string;
  planName?: string;
  planExpiresAt?: string | Date | null;
  worksheetsGenerated?: number | null;
};

type ProfileMenuDropdownProps = {
  user: ProfileMenuUser;
  onLogout: () => void;
  showPlanBadge?: boolean;
  className?: string;
  /** compact: icon + chevron only (mobile header) */
  variant?: "default" | "compact";
};

export function ProfileMenuDropdown({
  user,
  onLogout,
  showPlanBadge = true,
  className,
  variant = "default",
}: ProfileMenuDropdownProps) {
  const planInfo = getProfilePlanInfo(user);
  const initials = (user.name || "U")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm outline-none transition-all duration-200",
            "hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/40",
            className,
          )}
          data-testid="button-profile-menu"
          aria-label="Open profile menu"
        >
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
              "bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/25",
            )}
          >
            {initials}
          </span>
          {variant === "default" && (
            <>
              <span className="hidden lg:flex flex-col items-start max-w-[180px] min-w-0">
                <span className="flex items-center gap-1 min-w-0">
                  <span
                    className="truncate font-medium text-foreground text-xs leading-tight"
                    data-testid="text-username"
                  >
                    {user.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </span>
                {showPlanBadge && (
                  <span
                    className="truncate text-[10px] text-muted-foreground leading-tight"
                    data-testid="text-plan"
                  >
                    {planInfo.displayName}
                  </span>
                )}
              </span>
            </>
          )}
          {variant === "compact" && (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "w-[min(100vw-2rem,20rem)] p-0 overflow-hidden rounded-2xl border shadow-xl",
          "bg-white border-gray-200",
          "dark:bg-[#11111c]/95 dark:border-purple-500/20 dark:backdrop-blur-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "transition-all duration-200",
        )}
      >
        <div className="p-4 border-b border-gray-200 dark:border-purple-500/15">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white shadow-lg shadow-purple-500/20">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Current Plan
          </p>
          <div
            className={cn(
              "rounded-xl border p-3 space-y-2",
              "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/60",
              "dark:bg-gradient-to-r dark:from-purple-500/10 dark:to-pink-500/10 dark:border-purple-500/20",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-pink-400" />
                {planInfo.displayName}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  planInfo.status === "Active" &&
                    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  planInfo.status === "Free" &&
                    "bg-muted text-muted-foreground",
                  planInfo.status === "Expired" &&
                    "bg-red-500/15 text-red-600 dark:text-red-300",
                )}
              >
                {planInfo.status}
              </span>
            </div>
            <dl className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between gap-2">
                <dt>Worksheets</dt>
                <dd className="text-gray-900 dark:text-gray-200 font-medium">
                  {planInfo.isFree
                    ? `Limit: ${planInfo.worksheetsIncluded}`
                    : `Up to ${planInfo.worksheetsIncluded} / month`}
                </dd>
              </div>
              {planInfo.expiresLabel && (
                <div className="flex justify-between gap-2">
                  <dt>Expires</dt>
                  <dd className="text-gray-900 dark:text-gray-200 font-medium">
                    {planInfo.expiresLabel}
                  </dd>
                </div>
              )}
              {planInfo.worksheetsLeft !== null && (
                <div className="flex justify-between gap-2">
                  <dt>Worksheets left</dt>
                  <dd className="text-gray-900 dark:text-white font-semibold">
                    {planInfo.worksheetsLeft}
                  </dd>
                </div>
              )}
              {planInfo.isFree && (
                <div className="flex justify-between gap-2">
                  <dt>Used</dt>
                  <dd className="text-gray-900 dark:text-gray-200 font-medium">
                    {planInfo.worksheetsUsed} of {planInfo.worksheetsIncluded}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="p-3 pt-0 flex flex-col gap-1.5">
          <Link href="/pricing">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 rounded-xl border-purple-200/60 dark:border-purple-500/25 hover:bg-purple-50 dark:hover:bg-purple-500/10"
              data-testid="button-profile-view-plans"
            >
              <CreditCard className="w-4 h-4" />
              View Plans
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 rounded-xl text-red-600 hover:text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
