import { Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Users, Menu, X, Building2 } from "lucide-react";
import { useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 mt-2">
      <Link
        to="/dashboard"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary"
        activeProps={{ className: "active" }}
      >
        <LayoutDashboard className="size-4" />
        Dashboard
      </Link>
      <Link
        to="/tenants"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:text-sidebar-primary"
        activeProps={{ className: "active" }}
      >
        <Users className="size-4" />
        Tenants
      </Link>
    </nav>
  );

  return (
    <div className="app-layout">
      {/* Desktop sidebar */}
      <aside className="sidebar hidden md:flex">
        <div className="sidebar-content">
          <Link to="/dashboard" className="flex items-center gap-2.5 mb-8 px-1">
            <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="size-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-display text-xl text-sidebar-foreground tracking-tight">Hamro Rent</span>
          </Link>

          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Navigation
          </p>
          <NavLinks />
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`sidebar md:hidden ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <div className="flex items-center justify-between mb-8 px-1">
            <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
              <div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Building2 className="size-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-display text-xl text-sidebar-foreground tracking-tight">Hamro Rent</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Mobile top bar */}
        <header className="md:hidden border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display text-lg">Hamro Rent</span>
          <div className="w-9" />
        </header>

        <main className="mx-auto max-w-5xl px-6 py-8 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "paid" | "partial" | "pending" | "overpaid" }) {
  const map = {
    paid: "bg-success/12 text-success border-success/25",
    partial: "bg-warning/15 text-warning-foreground border-warning/30",
    pending: "bg-muted text-muted-foreground border-border",
    overpaid: "bg-accent/20 text-accent-foreground border-accent/40",
  } as const;

  const dot = {
    paid: "bg-success",
    partial: "bg-warning",
    pending: "bg-muted-foreground",
    overpaid: "bg-accent",
  } as const;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      <span className={`size-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
}
