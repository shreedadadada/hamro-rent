import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, Calculator, Calendar, ShieldCheck,
  Pencil, Save, X, ArrowRight, CheckCircle, Zap
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.jpeg";

const SITE_URL = "https://hamro-rent.lovable.app";

const DEFAULTS = {
  hero_eyebrow: "Built for Nepali landlords",
  hero_title_lead: "Your rental hisaab,",
  hero_title_accent: "finally organised.",
  hero_subtitle:
    "A clean, professional ledger for tracking tenants, monthly bills, and payments in Bikram Sambat months. Replace spreadsheets with something that actually works.",
  hero_cta_label: "Start free — no card required",
};

export const Route = createFileRoute("/")(
  {
  head: () => ({
    meta: [
      { title: "Hamro Rent — Rent, Water & Electricity Ledger for Nepali Landlords" },
      {
        name: "description",
        content:
          "Hamro Rent is the simplest way for Nepali landlords to track tenants, monthly rent, water and electricity bills, and payments — all in Bikram Sambat (BS) months. Free to start.",
      },
      { name: "keywords", content: "Hamro Rent, hamrorent, Nepali landlord app, rent ledger Nepal, BS calendar rent, tenant management Nepal, घर भाडा, room rent tracker Nepal" },
      { name: "author", content: "Hamro Rent" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "Hamro Rent — Rent Hisaab, Now Digital" },
      { property: "og:description", content: "Track tenants, rent, water and electricity bills in Nepali BS months. Built for landlords in Nepal." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:site_name", content: "Hamro Rent" },
      { property: "og:locale", content: "en_NP" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hamro Rent — Rent Hisaab, Now Digital" },
      { name: "twitter:description", content: "Tenant, rent and utility ledger for Nepali landlords. BS calendar built in." },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Hamro Rent",
              url: SITE_URL,
              logo: SITE_URL + "/favicon.ico",
            },
            {
              "@type": "SoftwareApplication",
              name: "Hamro Rent",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "Rent, water and electricity ledger for Nepali landlords with Bikram Sambat (BS) monthly billing.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "NPR" },
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
      return data ?? DEFAULTS;
    },
  });

  useEffect(() => {
    if (settings) {
      setDraft({
        hero_eyebrow: settings.hero_eyebrow ?? DEFAULTS.hero_eyebrow,
        hero_title_lead: settings.hero_title_lead ?? DEFAULTS.hero_title_lead,
        hero_title_accent: settings.hero_title_accent ?? DEFAULTS.hero_title_accent,
        hero_subtitle: settings.hero_subtitle ?? DEFAULTS.hero_subtitle,
        hero_cta_label: settings.hero_cta_label ?? DEFAULTS.hero_cta_label,
      });
    }
  }, [settings]);

  const hero = editing ? draft : { ...DEFAULTS, ...(settings ?? {}) };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").update(draft).eq("id", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Hero updated");
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["site_settings"] });
  };

  const features = [
    {
      icon: Calendar,
      title: "BS Calendar Billing",
      desc: "Bills organised by Baisakh through Chaitra. No AD-to-BS conversion guesswork, ever.",
      color: "text-primary",
      bg: "bg-primary/8",
    },
    {
      icon: Calculator,
      title: "Smart Electricity",
      desc: "Per-unit meter readings or flat NEA amount. Auto-calculated totals on every line.",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Building2,
      title: "Unlimited Tenants",
      desc: "Add rooms, edit details, archive when they move out — full history always preserved.",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: ShieldCheck,
      title: "Private & Secure",
      desc: "Each landlord sees only their own data. Cloud-backed with row-level security.",
      color: "text-primary",
      bg: "bg-primary/8",
    },
  ];

  const socialProof = [
    "Bikram Sambat months built-in",
    "WhatsApp bill sharing",
    "Excel & PDF export",
    "Tenant portal links",
    "Multi-charge support",
    "Overpayment tracking",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Hamro Rent logo" className="size-9 rounded-xl object-cover shadow-sm" />
            <span className="font-display text-xl tracking-tight">Hamro Rent</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {!editing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="hidden md:flex">
                    <Pencil className="mr-1.5 size-3.5" /> Edit hero
                  </Button>
                )}
                <Button asChild size="sm">
                  <Link to="/dashboard">
                    Open dashboard <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">
                    Get started <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center md:pt-28">
        {editing ? (
          <div className="space-y-4 rounded-2xl border border-primary/20 bg-card p-6 text-left shadow-lg">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Eyebrow</label>
              <Input value={draft.hero_eyebrow} onChange={(e) => setDraft({ ...draft, hero_eyebrow: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title — lead</label>
                <Input value={draft.hero_title_lead} onChange={(e) => setDraft({ ...draft, hero_title_lead: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title — accent</label>
                <Input value={draft.hero_title_accent} onChange={(e) => setDraft({ ...draft, hero_title_accent: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subtitle</label>
              <Textarea rows={3} value={draft.hero_subtitle} onChange={(e) => setDraft({ ...draft, hero_subtitle: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CTA label</label>
              <Input value={draft.hero_cta_label} onChange={(e) => setDraft({ ...draft, hero_cta_label: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-1.5 size-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1.5 size-3.5" /> {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <Zap className="size-3 text-accent" />
              {hero.hero_eyebrow}
            </div>

            <h1 className="font-display text-5xl leading-[1.1] tracking-tight md:text-7xl">
              {hero.hero_title_lead}
              <br />
              <em className="italic text-accent not-italic" style={{ fontStyle: "italic" }}>
                {hero.hero_title_accent}
              </em>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              {hero.hero_subtitle}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="rounded-xl px-7 shadow-md">
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  {isAuthenticated ? "Go to dashboard" : hero.hero_cta_label}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="outline" asChild className="rounded-xl px-7">
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
            </div>

            {/* Social proof chips */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {socialProof.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  <CheckCircle className="size-3 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Why Hamro Rent</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">Everything a Nepali landlord needs</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md stat-card"
            >
              <div className={`mb-4 inline-flex size-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <h3 className="mb-2 font-display text-lg leading-tight">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      {!isAuthenticated && (
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground">
            <h2 className="font-display text-3xl md:text-4xl">Ready to ditch the spreadsheets?</h2>
            <p className="mt-3 text-sm text-primary-foreground/70">
              Free to start. No credit card. Set up in under 5 minutes.
            </p>
            <Button
              size="lg"
              asChild
              className="mt-7 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 px-8 shadow-lg"
            >
              <Link to="/signup">
                Create your free account <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src={logo} alt="Hamro Rent" className="size-5 rounded-md object-cover" />
          <span className="font-medium text-foreground">Hamro Rent</span>
        </div>
        Built with care for landlords in Nepal · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
