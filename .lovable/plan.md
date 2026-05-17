## HamroRent — v1 Build Plan

A landlord-only rent management app on Lovable Cloud. Replaces the local-storage-only requirement from the spec with a real cloud backend so data persists across devices and is protected per-landlord.

### Scope of v1

Ships from the requirements doc:
- Email/password + Google auth (each landlord sees only their own data)
- Tenants: add, edit, deactivate (soft-delete), list active + archived
- BS calendar utilities (Baisakh → Chaitra, sorted by year+month #)
- Bills per tenant per BS month: rent, water, electricity (per-unit OR direct), unlimited additional charges
- Live-computed total + remaining balance + status badges (Paid / Partial / Pending / Overpaid)
- Payments: full / partial, method, BS date, notes; supports multiple payments per bill
- Dashboard: active tenants count, current BS month collection summary, per-tenant status
- Per-tenant payment history with year/status filters and lifetime totals
- Key validations from §5: duplicate bill block, curr<prev meter block, blank charge label block, zero/negative payment block, deactivate-with-balance warning

Deferred to v2 (called out, not built):
- Excel/PDF export, JSON backup
- Overpayment carry-forward auto-application across months (we show Overpaid status; manual handling)
- Tenant portal, SMS, online payments

### Design

Warm Sand palette in oklch tokens (sand bg `#faf8f5`, clay accent `#8b7355`, soft borders). Editorial serif headings (Instrument Serif) + clean sans body (Work Sans). Calm, paper-like surfaces — appropriate for a landlord ledger, not a flashy SaaS.

### Data model (Supabase, RLS scoped to `auth.uid()`)

```text
tenants
  id, owner_id (auth.users), name, room_number, phone, move_in_date_bs (text "YYYY-MM"),
  notes, is_active (bool), created_at

bills
  id, owner_id, tenant_id, bs_year (int), bs_month (int 1-12),
  rent_amount, water_amount,
  electricity_mode ('per_unit' | 'direct'),
  elec_prev_reading, elec_curr_reading, elec_rate, elec_service_charge, elec_direct_amount,
  notes, created_at, updated_at
  UNIQUE(tenant_id, bs_year, bs_month)

bill_charges        -- additional charges, one row per line item
  id, bill_id, label, amount

payments
  id, owner_id, bill_id, payment_date_bs, amount_paid, method, note, created_at
```

RLS: every table policy is `owner_id = auth.uid()` for select/insert/update/delete. `bill_charges` policies join via parent bill's owner.

### Routes

```text
/                       landing (marketing + sign-in CTA)
/login, /signup         auth pages
/_authenticated/        layout gate (redirect to /login if no session)
  /app                  dashboard
  /app/tenants          tenant list (active/archived tabs)
  /app/tenants/$id      tenant detail: bills list + create-bill form + payment history
  /app/tenants/new      add tenant
```

### Technical details

- Server functions in `src/lib/*.functions.ts` (tenants, bills, payments) using `requireSupabaseAuth` so RLS enforces ownership.
- BS calendar helpers in `src/lib/bs-calendar.ts` (month names, sorting, year picker range 2078–2090).
- Bill total computed live in a `src/lib/bill-math.ts` helper from rent + water + electricity (mode-aware) + sum(charges); never trust a stored total.
- `attachSupabaseAuth` registered in `src/start.ts`.
- TanStack Query for fetching; `router.invalidate()` + `queryClient.invalidateQueries()` on auth change in `__root.tsx`.
- Sonner toasts for warnings/blocks from §5.
- Google sign-in via `lovable.auth.signInWithOAuth("google", ...)` + `configure_social_auth`.

After v1 ships and you've used it for a bit, ping me to add Excel/PDF export and overpayment carry-forward.
