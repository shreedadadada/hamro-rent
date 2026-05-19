import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Calculator, Calendar, ShieldCheck, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SITE_URL = "https://hamro-rent.lovable.app";

const DEFAULTS = {
  hero_eyebrow: "For Nepali landlords",
  hero_title_lead: "Rent, water, electricity —",
  hero_title_accent: "tracked the Nepali way.",
  hero_subtitle:
    "A calm, paper-like ledger for managing tenants, monthly bills, and payments in Bikram Sambat months. No spreadsheets, no chaos.",
  hero_cta_label: "Start free",
};

export const Route = createFileRoute("/")({
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
              alternateName: ["HamroRent", "Hamro Rent App"],
              url: SITE_URL,
              logo: SITE_URL + "/favicon.ico",
            },
            {
              "@type": "WebSite",
              name: "Hamro Rent",
              url: SITE_URL,
              inLanguage: "en-NP",
              potentialAction: {
                "@type": "SearchAction",
                target: SITE_URL + "/?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@type": "SoftwareApplication",
              name: "Hamro Rent",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Rent, water and electricity ledger for Nepali landlords with Bikram Sambat (BS) monthly billing.",
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

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl">Hamro Rent</span>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-1 size-4" /> Edit hero
                </Button>
              )}
              <Button asChild>
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            </>
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
        {editing ? (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-card p-6 text-left">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Eyebrow</label>
              <Input value={draft.hero_eyebrow} onChange={(e) => setDraft({ ...draft, hero_eyebrow: e.target.value })} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Title — lead</label>
                <Input value={draft.hero_title_lead} onChange={(e) => setDraft({ ...draft, hero_title_lead: e.target.value })} />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Title — accent (italic)</label>
                <Input value={draft.hero_title_accent} onChange={(e) => setDraft({ ...draft, hero_title_accent: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Subtitle</label>
              <Textarea rows={3} value={draft.hero_subtitle} onChange={(e) => setDraft({ ...draft, hero_subtitle: e.target.value })} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Primary CTA label</label>
              <Input value={draft.hero_cta_label} onChange={(e) => setDraft({ ...draft, hero_cta_label: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); }}>
                <X className="mr-1 size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1 size-4" /> {saving ? "Saving…" : "Save hero"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 inline-block rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
              {hero.hero_eyebrow}
            </p>
            <h1 className="font-display text-5xl leading-tight md:text-7xl">
              {hero.hero_title_lead}
              <br />
              <em className="italic text-primary">{hero.hero_title_accent}</em>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{hero.hero_subtitle}</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button size="lg" asChild>
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  {isAuthenticated ? "Go to dashboard" : hero.hero_cta_label}
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
            </div>
          </>
        )}
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
        Hamro Rent · Built with care for landlords in Nepal
      </footer>
    </div>
  );
}
