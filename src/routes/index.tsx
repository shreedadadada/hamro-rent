import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Building2, Calculator, Calendar, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HamroRent — Tenant rent & utility ledger in BS months" },
      { name: "description", content: "Track tenants, monthly bills, electricity, water, and payments in Nepali calendar months. Built for landlords." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl">HamroRent</span>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="mb-4 inline-block rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          For Nepali landlords
        </p>
        <h1 className="font-display text-5xl leading-tight md:text-7xl">
          Rent, water, electricity —<br />
          <em className="italic text-primary">tracked the Nepali way.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          A calm, paper-like ledger for managing tenants, monthly bills, and payments in Bikram Sambat months. No spreadsheets, no chaos.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              {isAuthenticated ? "Go to dashboard" : "Start free"}
            </Link>
          </Button>
          {!isAuthenticated && (
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Calendar, title: "BS calendar billing", desc: "Bills organised by Baisakh through Chaitra — no AD conversion guesswork." },
          { icon: Calculator, title: "Smart electricity", desc: "Per-unit meter readings or flat NEA amount. Auto totals every line." },
          { icon: Building2, title: "Unlimited tenants", desc: "Add rooms, edit details, archive when they move out — history is kept." },
          { icon: ShieldCheck, title: "Private to you", desc: "Each landlord sees only their own data. Backed up in the cloud." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6">
            <Icon className="mb-3 size-6 text-primary" />
            <h3 className="mb-1 font-display text-xl">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        HamroRent · Built with care for landlords
      </footer>
    </div>
  );
}
