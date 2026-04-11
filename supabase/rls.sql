-- =============================================================================
-- Row Level Security Policies
-- CRITICAL: These policies ensure users can ONLY access their own vaults.
-- Without RLS, any authenticated user could read another user's encrypted data.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS even for the table owner (belt-and-suspenders)
ALTER TABLE public.vaults FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- VAULT POLICIES
-- =============================================================================

-- Users can SELECT their own vaults
CREATE POLICY "vaults_select_own"
  ON public.vaults
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can INSERT new vaults for themselves only
-- The CHECK prevents inserting with a different user_id
CREATE POLICY "vaults_insert_own"
  ON public.vaults
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can UPDATE their own vaults
-- USING: row must belong to user
-- WITH CHECK: updated row must still belong to user (prevents reassignment)
CREATE POLICY "vaults_update_own"
  ON public.vaults
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can DELETE their own vaults
CREATE POLICY "vaults_delete_own"
  ON public.vaults
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- USER PROFILES POLICIES
-- =============================================================================

CREATE POLICY "profiles_select_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================================================
-- SERVICE ROLE: no extra policies needed.
-- The service role bypasses RLS. NEVER expose the service role key client-side.
-- =============================================================================

-- =============================================================================
-- VAULT SIZE LIMIT (defence against accidental/malicious large payloads)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_vault_size()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF octet_length(NEW.encrypted_payload) > 10 * 1024 * 1024 THEN
    RAISE EXCEPTION 'Vault payload exceeds 10 MB limit.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vaults_size_limit ON public.vaults;
CREATE TRIGGER vaults_size_limit
  BEFORE INSERT OR UPDATE ON public.vaults
  FOR EACH ROW EXECUTE FUNCTION public.check_vault_size();
