-- Add share token to tenants for public read-only portal
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS tenants_share_token_idx ON public.tenants(share_token);

-- Security definer function: fetch tenant + bills + charges + payments by share token.
-- Bypasses RLS in a controlled way, returns only the data for that one token.
CREATE OR REPLACE FUNCTION public.get_tenant_portal(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'tenant', to_jsonb(t.*) - 'owner_id',
    'bills', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(b.*) - 'owner_id' || jsonb_build_object(
          'bill_charges', COALESCE((SELECT jsonb_agg(to_jsonb(c.*)) FROM bill_charges c WHERE c.bill_id = b.id), '[]'::jsonb),
          'payments', COALESCE((SELECT jsonb_agg(to_jsonb(p.*) - 'owner_id') FROM payments p WHERE p.bill_id = b.id), '[]'::jsonb)
        )
        ORDER BY b.bs_year DESC, b.bs_month DESC
      )
      FROM bills b WHERE b.tenant_id = t.id
    ), '[]'::jsonb)
  ) INTO result
  FROM tenants t
  WHERE t.share_token = _token;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_portal(uuid) TO anon, authenticated;