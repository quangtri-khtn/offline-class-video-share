-- CRITICAL SECURITY FIXES

-- 1. Enable RLS on all tables that don't have it
ALTER TABLE public.m_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m_user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m_lesson ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function for role checking to prevent recursive RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT user_group FROM public.m_user WHERE id = ((auth.uid())::text)::integer;
$$;

-- 3. Create proper RLS policies for m_user table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.m_user;

CREATE POLICY "Users can view own profile"
ON public.m_user
FOR SELECT
TO authenticated
USING (id = ((auth.uid())::text)::integer);

CREATE POLICY "Admin can view all users"
ON public.m_user
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 0);

-- 4. Create RLS policies for m_company table
CREATE POLICY "Admin can manage companies"
ON public.m_company
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 0);

-- 5. Create RLS policies for m_user_role table
CREATE POLICY "Users can view own roles"
ON public.m_user_role
FOR SELECT
TO authenticated
USING (userid = ((auth.uid())::text)::integer);

CREATE POLICY "Admin can manage all roles"
ON public.m_user_role
FOR ALL
TO authenticated
USING (public.get_current_user_role() = 0);

-- 6. Create RLS policies for m_lesson table
CREATE POLICY "Users can view lessons for their class"
ON public.m_lesson
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 0 OR  -- Admin can see all
  class_group::integer = public.get_current_user_role()  -- Users see their class
);

CREATE POLICY "Teachers can manage lessons for their class"
ON public.m_lesson
FOR ALL
TO authenticated
USING (
  public.get_current_user_role() = 0 OR  -- Admin can manage all
  (public.get_current_user_role() = 1 AND class_group::integer = public.get_current_user_role())  -- Teachers manage their class
);

-- 7. Update lesson_results policies to be more restrictive
DROP POLICY IF EXISTS "Teachers can view lessons of their class" ON public.lesson_results;
DROP POLICY IF EXISTS "Teachers can create lessons for their class" ON public.lesson_results;
DROP POLICY IF EXISTS "Teachers can update their own lessons" ON public.lesson_results;
DROP POLICY IF EXISTS "Teachers can delete their own lessons" ON public.lesson_results;

CREATE POLICY "Users can view lessons for their class or admin sees all"
ON public.lesson_results
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 0 OR  -- Admin can see all
  class_group = public.get_current_user_role()  -- Users see their class
);

CREATE POLICY "Teachers can create lessons for their class"
ON public.lesson_results
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 1 AND  -- Must be teacher
  teacher_id = ((auth.uid())::text)::integer AND  -- Must be the authenticated user
  class_group = public.get_current_user_role()  -- Must match their class
);

CREATE POLICY "Teachers can update their own lessons"
ON public.lesson_results
FOR UPDATE
TO authenticated
USING (
  teacher_id = ((auth.uid())::text)::integer AND
  public.get_current_user_role() = 1
);

CREATE POLICY "Admin can delete any lesson"
ON public.lesson_results
FOR DELETE
TO authenticated
USING (public.get_current_user_role() = 0);

-- 8. Secure storage policies - remove overly permissive ones and add proper auth
DELETE FROM storage.objects WHERE bucket_id = 'lesson-files' AND name IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_3" ON storage.objects;

-- Create secure storage policies
CREATE POLICY "Authenticated users can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-files');

CREATE POLICY "Teachers can upload files to their class folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-files' AND
  (storage.foldername(name))[1] = ('class_' || public.get_current_user_role()::text)
);

CREATE POLICY "Admin can manage all files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'lesson-files' AND
  public.get_current_user_role() = 0
);

-- 9. Add password hash function for future migration
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 10. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 0);