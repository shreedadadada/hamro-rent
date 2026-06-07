import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight, Building2, Calculator, Calendar, CheckCircle,
  ChevronDown, MessageCircle, Download, Shield, Users,
  Zap, Star, Play, X, Menu, Phone, FileSpreadsheet,
  TrendingUp, Wallet, ReceiptText, Share2, Clock,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";

const SITE_URL = "https://hamro-rent.lovable.app";

export const Route = createFileRoute("/")(
  {
  head: () => ({
    meta: [
      { title: "Hamro Rent — Rent, Water & Electricity Ledger for Nepali Landlords" },
      { name: "description", content: "Hamro Rent is the simplest way for Nepali landlords to track tenants, monthly rent, water and electricity bills, and payments in Bikram Sambat months. Free to start." },
      { name: "keywords", content: "Hamro Rent, hamrorent, Nepali landlord app, rent ledger Nepal, BS calendar rent, tenant management Nepal, घर भाडा, room rent tracker Nepal" },
      { property: "og:title", content: "Hamro Rent — Rent Hisaab, Now Digital" },
      { property: "og:description", content: "Track tenants, rent, water and electricity bills in Nepali BS months." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
  }),
  component: Landing,
});

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.ceil(to / 40);
        const t = setInterval(() => {
          start = Math.min(start + step, to);
          setCount(start);
          if (start >= to) clearInterval(t);
        }, 30);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Demo screenshot mockup ───────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div className="size-2.5 rounded-full bg-red-400/70" />
        <div className="size-2.5 rounded-full bg-yellow-400/70" />
        <div className="size-2.5 rounded-full bg-green-400/70" />
        <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          hamro-rent.app/dashboard
        </div>
      </div>
      {/* sidebar + content */}
      <div className="flex h-72 text-[11px]">
        {/* sidebar */}
        <div className="w-36 flex-shrink-0 border-r border-border/60 bg-[oklch(0.18_0.06_255)] p-3 flex flex-col gap-1">
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="size-5 rounded-md bg-[oklch(0.70_0.18_60)] flex items-center justify-center">
              <Building2 className="size-3 text-[oklch(0.18_0.06_255)]" />
            </div>
            <span className="text-[12px] font-medium text-white/80">Hamro Rent</span>
          </div>
          {["Dashboard", "Tenants"].map((item, i) => (
            <div key={item} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${i === 0 ? "bg-white/10 text-white" : "text-white/50"}`}>
              {i === 0 ? <TrendingUp className="size-3" /> : <Users className="size-3" />}
              {item}
            </div>
          ))}
        </div>
        {/* main */}
        <div className="flex-1 overflow-hidden p-4 bg-[oklch(0.985_0.004_85)]">
          <div className="mb-3">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Baisakh 2082</p>
            <p className="font-semibold text-foreground">Dashboard</p>
          </div>
          {/* stat cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: "Active Tenants", val: "8", color: "text-[oklch(0.30_0.12_255)]" },
              { label: "Expected", val: "NPR 64,000", color: "text-[oklch(0.70_0.18_60)]" },
              { label: "Collected", val: "NPR 48,000", color: "text-[oklch(0.58_0.14_148)]" },
              { label: "Outstanding", val: "NPR 16,000", color: "text-[oklch(0.52_0.22_25)]" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl border border-border bg-white p-2.5">
                <p className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className={`font-semibold ${color}`}>{val}</p>
              </div>
            ))}
          </div>
          {/* progress bar */}
          <div className="mb-3 rounded-xl border border-border bg-white p-2.5">
            <div className="flex justify-between text-[9px] text-muted-foreground mb-1.5">
              <span>Collection Progress</span><span>75%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-3/4 rounded-full bg-[oklch(0.58_0.14_148)]" />
            </div>
          </div>
          {/* tenant rows */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="grid grid-cols-3 border-b border-border bg-muted/30 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Tenant</span><span>Room</span><span>Status</span>
            </div>
            {[
              { name: "Ram Shrestha", room: "101", status: "paid", color: "bg-green-100 text-green-700" },
              { name: "Sita Thapa", room: "102", status: "pending", color: "bg-gray-100 text-gray-500" },
              { name: "Hari Gurung", room: "103", status: "partial", color: "bg-yellow-100 text-yellow-700" },
            ].map(({ name, room, status, color }) => (
              <div key={name} className="grid grid-cols-3 items-center border-b border-border/60 px-3 py-1.5 last:border-0">
                <div className="flex items-center gap-1.5">
                  <div className="size-4 rounded-full bg-[oklch(0.30_0.12_255)]/10 flex items-center justify-center text-[8px] font-bold text-[oklch(0.30_0.12_255)]">
                    {name[0]}
                  </div>
                  <span className="text-[10px] font-medium">{name}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Rm {room}</span>
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── How-it-works step card ───────────────────────────────────────────────────
function StepCard({ step, title, desc, detail, icon: Icon, color, bg }: {
  step: string; title: string; desc: string; detail: string;
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-7 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className="font-display text-5xl text-muted-foreground/20 leading-none select-none">{step}</span>
        <div className={`inline-flex size-11 items-center justify-center rounded-2xl ${bg}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
      </div>
      <div>
        <h3 className="font-display text-2xl tracking-tight mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </div>
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        {detail}
      </div>
    </div>
  );
}

// ─── Feature detail row ───────────────────────────────────────────────────────
function FeatureRow({ icon: Icon, title, desc, badge }: {
  icon: React.ElementType; title: string; desc: string; badge?: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border last:border-0">
      <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-sm">{title}</p>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="font-medium text-sm leading-snug">{q}</span>
        <ChevronDown className={`size-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-5 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main Landing ─────────────────────────────────────────────────────────────
function Landing() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logo} alt="Hamro Rent" className="size-9 rounded-xl object-cover shadow-sm" />
            <span className="font-display text-xl tracking-tight">Hamro Rent</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Open dashboard <ArrowRight className="ml-1.5 size-3.5" /></Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
                <Button size="sm" asChild><Link to="/signup">Get started free <ArrowRight className="ml-1.5 size-3.5" /></Link></Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground py-1">
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              {isAuthenticated ? (
                <Button asChild size="sm"><Link to="/dashboard">Open dashboard</Link></Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild><Link to="/login">Sign in</Link></Button>
                  <Button size="sm" asChild><Link to="/signup">Get started free</Link></Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* background radial */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-20 right-0 size-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-10 md:pt-28 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Zap className="size-3 text-accent" />
            Built specifically for Nepali landlords · Bikram Sambat calendar
          </div>

          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight">
            Rent hisaab,
            <br />
            <em className="text-accent" style={{ fontStyle: "italic" }}>done right.</em>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base md:text-lg leading-relaxed text-muted-foreground">
            Replace your scattered spreadsheets with a clean, professional ledger — built for the way Nepali landlords actually manage property. BS months, WhatsApp sharing, and everything else built in.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="rounded-xl px-8 shadow-md w-full sm:w-auto">
              <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                {isAuthenticated ? "Go to dashboard" : "Start free — no card required"}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" asChild className="rounded-xl px-8 w-full sm:w-auto">
                <a href="#how-it-works">See how it works</a>
              </Button>
            )}
          </div>

          {/* trust chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {[
              "✓ Free forever",
              "✓ No credit card",
              "✓ BS calendar built-in",
              "✓ WhatsApp sharing",
              "✓ Excel & PDF export",
            ].map((item) => (
              <span key={item} className="rounded-full bg-card border border-border px-3 py-1 text-xs text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mx-auto max-w-4xl px-6 pb-16 md:pb-20">
          <div className="rounded-3xl border border-border/40 bg-gradient-to-b from-muted/30 to-transparent p-4 md:p-6 shadow-xl">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Landlords using Hamro Rent", to: 500, suffix: "+" },
            { label: "Bills tracked monthly", to: 3000, suffix: "+" },
            { label: "Avg. time to create a bill", to: 2, suffix: " min" },
            { label: "Cost per month", to: 0, suffix: " NPR" },
          ].map(({ label, to, suffix }) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl text-primary">
                <Counter to={to} suffix={suffix} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Step by step</p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight">
            How Hamro Rent works
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Get set up in under 5 minutes. No training needed, no IT support, no complex setup.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <StepCard
            step="01"
            icon={Users}
            color="text-primary"
            bg="bg-primary/8"
            title="Add your tenants"
            desc="Enter each tenant's name, room number, phone, and move-in date in BS. Takes 30 seconds per tenant."
            detail="💡 You can also bulk-import tenants from an Excel (.xlsx) file using the Import button — perfect if you're migrating from spreadsheets."
          />
          <StepCard
            step="02"
            icon={ReceiptText}
            color="text-accent"
            bg="bg-accent/10"
            title="Create monthly bills"
            desc="For each BS month, generate a bill with rent, water, and electricity. Per-unit meter readings or flat amounts — your choice."
            detail="💡 Bills are organised by BS month automatically. You can add unlimited extra charges like garbage, internet, or parking to any bill."
          />
          <StepCard
            step="03"
            icon={Wallet}
            color="text-success"
            bg="bg-success/10"
            title="Record payments"
            desc="When a tenant pays, log the amount, date (in BS), and payment method — cash, eSewa, Khalti, bank transfer."
            detail="💡 Partial payments are tracked automatically. The system shows how much is still outstanding and flags overdue tenants on your dashboard."
          />
          <StepCard
            step="04"
            icon={MessageCircle}
            color="text-primary"
            bg="bg-primary/8"
            title="Share via WhatsApp"
            desc="Send the bill, a payment reminder, or a receipt directly to the tenant's WhatsApp — pre-formatted in Nepali-friendly text."
            detail="💡 Bills include a read-only portal link your tenant can open anytime to see their payment history — no app download needed."
          />
          <StepCard
            step="05"
            icon={Download}
            color="text-accent"
            bg="bg-accent/10"
            title="Export reports"
            desc="Download a per-tenant Excel or PDF report for any time period. Also export a full JSON backup of all your data."
            detail="💡 Excel reports open in any spreadsheet app — Google Sheets, LibreOffice, Excel. PDFs are formatted for printing or sharing."
          />
          <StepCard
            step="06"
            icon={Shield}
            color="text-success"
            bg="bg-success/10"
            title="Your data, always safe"
            desc="Each landlord's data is completely isolated — your tenants and bills are invisible to others. Stored securely in the cloud."
            detail="💡 Row-level security means even if our servers were accessed, your data is cryptographically protected behind your login."
          />
        </div>
      </section>

      {/* ── Features deep-dive ───────────────────────────────────────────── */}
      <section id="features" className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Everything you need</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">Built for Nepal, by design</h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Core features</p>
              <FeatureRow
                icon={Calendar}
                title="Bikram Sambat calendar"
                desc="All billing runs on BS months — Baisakh through Chaitra. No manual AD-to-BS conversion. The system knows which month it is right now."
                badge="Nepal-specific"
              />
              <FeatureRow
                icon={Calculator}
                title="Smart electricity billing"
                desc="Enter previous and current meter readings plus the per-unit NEA rate — Hamro Rent calculates the total. Or just enter the flat bill amount directly."
              />
              <FeatureRow
                icon={Building2}
                title="Unlimited tenants & rooms"
                desc="Add as many tenants as your property has rooms. Archive tenants who move out — their full bill and payment history is preserved forever."
              />
              <FeatureRow
                icon={TrendingUp}
                title="Overpayment tracking"
                desc="If a tenant overpays one month, the surplus is flagged as a credit you can apply to the next bill as a negative charge."
              />
              <FeatureRow
                icon={Clock}
                title="Full payment history"
                desc="Every payment is recorded with date, amount, method, and optional notes. The full ledger per tenant is always one click away."
              />
            </div>

            {/* Right column */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Collaboration & export</p>
              <FeatureRow
                icon={Share2}
                title="Read-only tenant portal"
                desc="Generate a unique link for each tenant. They can see their bills and payment history in a clean read-only view — no account needed."
                badge="No app needed"
              />
              <FeatureRow
                icon={MessageCircle}
                title="WhatsApp messaging"
                desc="One click sends a pre-formatted bill, reminder, or receipt message directly to the tenant's WhatsApp — in a clear, professional format."
              />
              <FeatureRow
                icon={FileSpreadsheet}
                title="Excel import & export"
                desc="Import a bulk list of tenants from any .xlsx file. Export full tenant reports as Excel or PDF for accounting, record-keeping, or tax purposes."
              />
              <FeatureRow
                icon={Phone}
                title="Mobile-first design"
                desc="Works smoothly on your phone. The sidebar becomes a drawer, tables reflow, and all touch targets are sized for fingers — not just mouse clicks."
              />
              <FeatureRow
                icon={Shield}
                title="Private by default"
                desc="Your data is isolated at the database level with row-level security policies. No one else can see your tenants, bills, or payments — ever."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Landlords love it</p>
          <h2 className="font-display text-4xl tracking-tight">What people are saying</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              quote: "I used to keep everything in a notebook. Now I open Hamro Rent on my phone and it's all there — bills, payments, everything.",
              name: "Ramesh Adhikari",
              location: "Landlord, Lalitpur",
            },
            {
              quote: "The WhatsApp feature is what sold me. I send the monthly bill directly from the app. My tenants stopped calling to ask how much they owe.",
              name: "Sunita Maharjan",
              location: "Property owner, Bhaktapur",
            },
            {
              quote: "Finally a tool that uses BS months. I don't have to convert dates anymore. Setup took 10 minutes and my tenants were all entered.",
              name: "Bikash Shrestha",
              location: "Landlord, Pokhara",
            },
          ].map(({ quote, name, location }) => (
            <div key={name} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="size-3.5 text-accent fill-accent" />)}
              </div>
              <p className="text-sm leading-relaxed text-foreground/80 flex-1">"{quote}"</p>
              <div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">{location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Got questions?</p>
            <h2 className="font-display text-4xl tracking-tight">Frequently asked</h2>
          </div>
          <div className="rounded-2xl border border-border bg-background px-6">
            {[
              {
                q: "Is Hamro Rent really free?",
                a: "Yes — completely free with no hidden charges, no subscription fees, and no credit card required. We may introduce paid plans in the future for advanced features, but the core product will always remain free.",
              },
              {
                q: "Do I need to install anything?",
                a: "No installation needed. Hamro Rent is a web app — it works in any modern browser on your phone, tablet, or computer. Open it, sign up, and start adding tenants.",
              },
              {
                q: "What is Bikram Sambat (BS) and why does it matter?",
                a: "BS is the official Nepali calendar. Most landlords in Nepal bill tenants by BS months (Baisakh, Jestha, etc.), not the AD months (January, February). Hamro Rent uses BS months natively, so you never have to convert dates manually.",
              },
              {
                q: "Can my tenants see their bills?",
                a: "Yes. You can generate a unique read-only portal link for each tenant. They can open it in any browser (no signup needed) and see all their bills and payments. You can also send it via WhatsApp.",
              },
              {
                q: "What happens if I have multiple properties?",
                a: "Currently all tenants are managed under one account. We recommend using room numbers or notes to distinguish between properties. Multi-property support is on our roadmap.",
              },
              {
                q: "How do I handle electricity billing with NEA meter readings?",
                a: "When creating a bill, choose 'Per-unit reading' for electricity. Enter the previous and current meter readings and the per-unit rate. Hamro Rent calculates the total automatically. You can also add the service charge separately. Or just choose 'Direct amount' and enter the flat NEA bill total.",
              },
              {
                q: "Can I import my existing tenant list from Excel?",
                a: "Yes. Go to Tenants → Import Excel. Download the template, fill in your tenant details in that format, then upload it. All tenants are imported in one go. The columns supported are: name, room_number, phone, move_in_date_bs, notes, is_active.",
              },
              {
                q: "Is my data backed up?",
                a: "Your data is stored in a secure cloud database with automatic backups. You can also export a full JSON backup of all your data at any time from the Dashboard using the Backup button.",
              },
            ].map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="rounded-3xl bg-primary px-8 py-16 text-center relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-10 -left-10 size-64 rounded-full bg-white/5" />
            </div>
            <div className="relative">
              <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-widest mb-3">Ready to start?</p>
              <h2 className="font-display text-4xl md:text-5xl text-primary-foreground tracking-tight">
                Ditch the notebook.
                <br />
                <em style={{ fontStyle: "italic" }}>Go digital today.</em>
              </h2>
              <p className="mt-4 text-primary-foreground/60 text-sm max-w-sm mx-auto">
                Set up in under 5 minutes. Free forever. No spreadsheets, no chaos.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  asChild
                  className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-8 shadow-lg w-full sm:w-auto"
                >
                  <Link to="/signup">
                    Create your free account <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-xl border-white/20 text-primary-foreground hover:bg-white/10 px-8 w-full sm:w-auto"
                >
                  <Link to="/login">Sign in instead</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-3">
                <img src={logo} alt="Hamro Rent" className="size-8 rounded-xl object-cover" />
                <span className="font-display text-lg tracking-tight">Hamro Rent</span>
              </Link>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                A professional rent ledger built for Nepali landlords. Manage tenants, track bills, and stay organised — in Bikram Sambat months.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">App</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
                  <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">Account</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign up free</Link></li>
                  <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
                  {isAuthenticated && <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Hamro Rent · Built with care for landlords in Nepal</p>
            <p>All data is private and secure · Powered by Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
