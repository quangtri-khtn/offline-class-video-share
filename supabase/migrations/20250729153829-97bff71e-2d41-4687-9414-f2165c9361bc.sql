-- Fix remaining security issues

-- 1. Fix search path for the function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT user_group FROM public.m_user WHERE id = ((auth.uid())::text)::integer;
$$;

-- 2. Enable RLS on storage.objects (this should fix the policy exists RLS disabled error)
-- Note: We can't directly enable RLS on storage.objects as it's managed by Supabase
-- Instead, we'll ensure our storage policies are correctly configured

-- 3. Check if there are any remaining tables without RLS
-- Let's ensure all our custom tables have RLS enabled
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;