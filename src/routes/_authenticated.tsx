import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link, useRouter } from "@tanstack/react-router";

function AuthErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const isAuthError =
    error.message?.toLowerCase().includes("auth") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("session") ||
    error.message?.toLowerCase().includes("jwt");

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="mb-5 inline-flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" />
        </div>
        <h2 className="font-display text-2xl tracking-tight mb-2">
          {isAuthError ? "Session expired" : "Something went wrong"}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-6">
          {isAuthError
            ? "Your session has expired. Please sign in again to continue."
            : error.message || "An unexpected error occurred on this page."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          {isAuthError ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign in again
            </Link>
          ) : (
            <button
              onClick={() => { router.invalidate(); reset(); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="size-4" /> Try again
            </button>
          )}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="size-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function AuthPendingComponent() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-primary/40"
              style={{ animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: () => <Outlet />,
  errorComponent: AuthErrorComponent,
  pendingComponent: AuthPendingComponent,
});
