import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, RefreshCw, AlertTriangle, Search, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.jpeg";

import appCss from "../styles.css?url";

// ─── 404 Not Found ────────────────────────────────────────────────────────────
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative max-w-md">
        <div className="mb-6 inline-flex size-20 items-center justify-center rounded-3xl bg-muted">
          <Search className="size-9 text-muted-foreground" />
        </div>

        <p className="font-display text-8xl font-light text-muted-foreground/30 leading-none mb-4 select-none">404</p>

        <h1 className="font-display text-3xl tracking-tight mb-3">Page not found</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          The page you're looking for doesn't exist or may have been moved.
          Double-check the URL, or head back to safety.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="size-4" /> Go to homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-4" /> Go back
          </button>
        </div>

        {/* helpful links */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Maybe you were looking for…</p>
          <ul className="space-y-2 text-sm">
            {[
              { to: "/dashboard", label: "Dashboard", desc: "Your tenants and monthly overview" },
              { to: "/tenants", label: "Tenants", desc: "Manage all your tenants" },
              { to: "/tenants/new", label: "Add a tenant", desc: "Create a new tenant record" },
            ].map(({ to, label, desc }) => (
              <li key={to}>
                <Link to={to} className="flex items-start gap-3 rounded-xl p-2 hover:bg-muted transition-colors">
                  <Building2 className="size-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  const isAuthError = error.message?.toLowerCase().includes("auth") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("session");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-destructive/3 blur-3xl" />
      </div>

      <div className="relative max-w-md">
        <div className="mb-6 inline-flex size-20 items-center justify-center rounded-3xl bg-destructive/10">
          <AlertTriangle className="size-9 text-destructive" />
        </div>

        <h1 className="font-display text-3xl tracking-tight mb-3">Something went wrong</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          {isAuthError
            ? "Your session may have expired. Please sign in again to continue."
            : "An unexpected error occurred. This has been noted — please try again."}
        </p>

        {error.message && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-xs font-mono text-destructive/80 break-all">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthError ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign in again
            </Link>
          ) : (
            <button
              onClick={() => { router.invalidate(); reset(); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="size-4" /> Try again
            </button>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Home className="size-4" /> Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Loading / Pending ─────────────────────────────────────────────────────────
function PendingComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
      <div className="flex items-center gap-2.5">
        <img src={logo} alt="Hamro Rent" className="size-9 rounded-xl object-cover" />
        <span className="font-display text-xl tracking-tight">Hamro Rent</span>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-2 rounded-full bg-primary/40"
            style={{
              animation: "pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Loading…</p>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hamro Rent — Rent Hisaab, Now Digital" },
      { name: "description", content: "The simplest rent ledger for Nepali landlords. Track tenants, water, electricity and rent in Bikram Sambat months. Free." },
      { property: "og:title", content: "Hamro Rent — Rent Hisaab, Now Digital" },
      { property: "og:description", content: "Track tenants, rent, water and electricity bills in Nepali BS months." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: PendingComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthInvalidator() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInvalidator />
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
