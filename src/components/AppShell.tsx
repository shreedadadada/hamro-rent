import { Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Users } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="font-display text-2xl">
            HamroRent
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <Home className="size-4" /> Dashboard
            </Link>
            <Link
              to="/tenants"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <Users className="size-4" /> Tenants
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2">
              <LogOut className="size-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

export function StatusBadge({ status }: { status: "paid" | "partial" | "pending" | "overpaid" }) {
  const map = {
    paid: "bg-success/15 text-success border-success/30",
    partial: "bg-warning/20 text-warning-foreground border-warning/40",
    pending: "bg-muted text-muted-foreground border-border",
    overpaid: "bg-accent/30 text-accent-foreground border-accent",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
