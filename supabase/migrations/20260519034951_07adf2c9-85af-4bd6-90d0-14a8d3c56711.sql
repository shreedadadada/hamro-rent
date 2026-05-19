
CREATE TABLE public.site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  hero_eyebrow TEXT NOT NULL DEFAULT 'For Nepali landlords',
  hero_title_lead TEXT NOT NULL DEFAULT 'Rent, water, electricity —',
  hero_title_accent TEXT NOT NULL DEFAULT 'tracked the Nepali way.',
  hero_subtitle TEXT NOT NULL DEFAULT 'A calm, paper-like ledger for managing tenants, monthly bills, and payments in Bikram Sambat months. No spreadsheets, no chaos.',
  hero_cta_label TEXT NOT NULL DEFAULT 'Start free',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_auth_insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "site_settings_auth_update" ON public.site_settings FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
