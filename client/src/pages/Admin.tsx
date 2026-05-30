import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Shield, Users, FileText, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const STORAGE_KEY = "qikws_admin_key";

interface AdminStats {
  totalUsers: number;
  users: {
    id: number;
    email: string;
    name: string;
    plan: string;
    worksheetsGenerated: number;
    createdAt: string | null;
  }[];
  worksheetActivity: { date: string; count: number }[];
}

function planColor(plan: string): string {
  if (plan === "free") return "bg-gray-100 text-gray-600";
  if (plan === "no_watermark") return "bg-yellow-100 text-yellow-800";
  return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300";
}

export default function Admin() {
  const [inputKey, setInputKey] = useState("");
  const [savedKey, setSavedKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showKey, setShowKey] = useState(false);

  const { data, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats", savedKey],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": savedKey },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Access denied" }));
        throw new Error(err.message || "Access denied");
      }
      return res.json();
    },
    enabled: !!savedKey,
    retry: false,
  });

  const handleLogin = () => {
    if (!inputKey.trim()) return;
    localStorage.setItem(STORAGE_KEY, inputKey.trim());
    setSavedKey(inputKey.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedKey("");
    setInputKey("");
  };

  if (!savedKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="w-full max-w-sm p-8 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your admin secret key to continue.</p>
          </div>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="Admin secret key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="pr-10"
              data-testid="input-admin-key"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey((v) => !v)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            className="w-full bg-gradient-primary text-white"
            onClick={handleLogin}
            disabled={!inputKey.trim()}
            data-testid="button-admin-login"
          >
            <Lock className="w-4 h-4 mr-2" /> Enter Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading admin stats…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-sm w-full text-center space-y-4">
          <Shield className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-bold text-lg">Access Denied</h2>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" onClick={handleLogout} data-testid="button-admin-retry">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const chartData = (data?.worksheetActivity || []).map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">Qik Worksheets Admin</h1>
              <p className="text-xs text-muted-foreground">Backend Dashboard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-admin-logout">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4" data-testid="stat-total-users">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{data?.totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </Card>
        </div>

        <Card className="p-6" data-testid="chart-worksheet-activity">
          <h2 className="font-display font-bold text-lg mb-5">Worksheet Generation — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} worksheets`, "Generated"]}
              />
              <Bar dataKey="count" fill="url(#adminGrad)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="overflow-hidden" data-testid="table-users">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">All Users</h2>
            <span className="text-xs text-muted-foreground">{data?.totalUsers} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name / Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Worksheets</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {(data?.users || []).map((user, idx) => (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-user-${user.id}`}>
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planColor(user.plan)}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{user.worksheetsGenerated}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
