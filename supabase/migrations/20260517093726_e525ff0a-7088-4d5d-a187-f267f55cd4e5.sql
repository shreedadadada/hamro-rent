
-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- TENANTS
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  room_number TEXT,
  phone TEXT,
  move_in_date_bs TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_select_own" ON public.tenants FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "tenants_insert_own" ON public.tenants FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "tenants_update_own" ON public.tenants FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "tenants_delete_own" ON public.tenants FOR DELETE USING (auth.uid() = owner_id);
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_tenants_owner ON public.tenants(owner_id);

-- BILLS
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bs_year INTEGER NOT NULL,
  bs_month INTEGER NOT NULL CHECK (bs_month BETWEEN 1 AND 12),
  rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  water_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  electricity_mode TEXT NOT NULL DEFAULT 'direct' CHECK (electricity_mode IN ('per_unit','direct')),
  elec_prev_reading NUMERIC(12,2),
  elec_curr_reading NUMERIC(12,2),
  elec_rate NUMERIC(12,2),
  elec_service_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  elec_direct_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, bs_year, bs_month)
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bills_select_own" ON public.bills FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "bills_insert_own" ON public.bills FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "bills_update_own" ON public.bills FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "bills_delete_own" ON public.bills FOR DELETE USING (auth.uid() = owner_id);
CREATE TRIGGER trg_bills_updated BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_bills_tenant ON public.bills(tenant_id);
CREATE INDEX idx_bills_owner ON public.bills(owner_id);

-- BILL CHARGES
CREATE TABLE public.bill_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bill_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bill_charges_select_own" ON public.bill_charges FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bills b WHERE b.id = bill_id AND b.owner_id = auth.uid()));
CREATE POLICY "bill_charges_insert_own" ON public.bill_charges FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.bills b WHERE b.id = bill_id AND b.owner_id = auth.uid()));
CREATE POLICY "bill_charges_update_own" ON public.bill_charges FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.bills b WHERE b.id = bill_id AND b.owner_id = auth.uid()));
CREATE POLICY "bill_charges_delete_own" ON public.bill_charges FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.bills b WHERE b.id = bill_id AND b.owner_id = auth.uid()));
CREATE INDEX idx_bill_charges_bill ON public.bill_charges(bill_id);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  payment_date_bs TEXT NOT NULL,
  amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0),
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','bank','esewa','khalti','other')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "payments_update_own" ON public.payments FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "payments_delete_own" ON public.payments FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX idx_payments_bill ON public.payments(bill_id);
CREATE INDEX idx_payments_owner ON public.payments(owner_id);
