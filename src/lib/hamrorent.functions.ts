import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Tenants ----------

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tenants")
      .select("*")
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: tenant, error } = await context.supabase
      .from("tenants").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return tenant;
  });

const tenantInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(120),
  room_number: z.string().max(40).nullish(),
  phone: z.string().max(40).nullish(),
  move_in_date_bs: z.string().max(40).nullish(),
  notes: z.string().max(2000).nullish(),
  is_active: z.boolean().optional(),
});

export const saveTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => tenantInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { id, ...rest } = data;
      const { data: row, error } = await supabase
        .from("tenants").update(rest).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase
      .from("tenants").insert({ ...data, owner_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setTenantActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("tenants").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Bills ----------

export const listBillsForTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { tenantId: string }) =>
    z.object({ tenantId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: bills, error } = await context.supabase
      .from("bills")
      .select("*, bill_charges(*), payments(*)")
      .eq("tenant_id", data.tenantId)
      .order("bs_year", { ascending: false })
      .order("bs_month", { ascending: false });
    if (error) throw new Error(error.message);
    return bills ?? [];
  });

export const listAllBills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bills")
      .select("*, bill_charges(*), payments(*), tenants(id,name,room_number,is_active)")
      .order("bs_year", { ascending: false })
      .order("bs_month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const chargeInput = z.object({
  label: z.string().min(1, "Charge label is required").max(80),
  amount: z.coerce.number().min(0).max(10_000_000),
});

const billInput = z.object({
  tenant_id: z.string().uuid(),
  bs_year: z.coerce.number().int().min(2000).max(2200),
  bs_month: z.coerce.number().int().min(1).max(12),
  rent_amount: z.coerce.number().min(0).max(10_000_000).default(0),
  water_amount: z.coerce.number().min(0).max(10_000_000).default(0),
  electricity_mode: z.enum(["per_unit", "direct"]),
  elec_prev_reading: z.coerce.number().min(0).nullable().optional(),
  elec_curr_reading: z.coerce.number().min(0).nullable().optional(),
  elec_rate: z.coerce.number().min(0).nullable().optional(),
  elec_service_charge: z.coerce.number().min(0).default(0),
  elec_direct_amount: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).nullish(),
  charges: z.array(chargeInput).max(50).default([]),
});

export const createBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => billInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    if (data.electricity_mode === "per_unit") {
      if (data.elec_prev_reading == null || data.elec_curr_reading == null || data.elec_rate == null) {
        throw new Error("Per-unit electricity requires previous reading, current reading, and rate.");
      }
      if (data.elec_curr_reading < data.elec_prev_reading) {
        throw new Error("Current meter reading must be greater than or equal to previous reading.");
      }
    }

    const { charges, ...bill } = data;
    const { data: created, error } = await supabase
      .from("bills")
      .insert({ ...bill, owner_id: userId })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error("A bill for this tenant and month already exists.");
      }
      throw new Error(error.message);
    }

    if (charges.length > 0) {
      const { error: chErr } = await supabase
        .from("bill_charges")
        .insert(charges.map((c) => ({ ...c, bill_id: created.id })));
      if (chErr) throw new Error(chErr.message);
    }
    return created;
  });

export const deleteBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("bills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Payments ----------

const paymentInput = z.object({
  bill_id: z.string().uuid(),
  payment_date_bs: z.string().min(1).max(40),
  amount_paid: z.coerce.number().positive("Amount must be greater than 0").max(10_000_000),
  method: z.enum(["cash", "bank", "esewa", "khalti", "other"]),
  note: z.string().max(500).nullish(),
});

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("payments").insert({ ...data, owner_id: userId }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("payments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Portal & exports ----------

export const regenerateShareToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ tenant_id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("tenants")
      .update({ share_token: crypto.randomUUID() })
      .eq("id", data.tenant_id)
      .select("share_token")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getTenantPortal = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) =>
    z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin.rpc("get_tenant_portal", { _token: data.token });
    if (error) throw new Error(error.message);
    if (!result || !(result as any).tenant) throw new Error("Portal link not found or revoked.");
    return result as { tenant: any; bills: any[] };
  });

export const exportAllData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [tenants, bills, charges, payments] = await Promise.all([
      context.supabase.from("tenants").select("*"),
      context.supabase.from("bills").select("*"),
      context.supabase.from("bill_charges").select("*"),
      context.supabase.from("payments").select("*"),
    ]);
    return {
      exported_at: new Date().toISOString(),
      app: "HamroRent",
      tenants: tenants.data ?? [],
      bills: bills.data ?? [],
      bill_charges: charges.data ?? [],
      payments: payments.data ?? [],
    };
  });
