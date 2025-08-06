
-- Fix the get_current_user_role function to properly handle authentication
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT user_group FROM public.m_user WHERE id = ((auth.uid())::text)::integer),
    -1
  );
$function$;

-- Enable RLS on all tables that are missing it
ALTER TABLE public.m_company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m_user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.m_lesson ENABLE ROW LEVEL SECURITY;

-- Fix lesson_results RLS policies - remove conflicting policies and create proper ones
DROP POLICY IF EXISTS "Teachers can create lessons for their class" ON public.lesson_results;
DROP POLICY IF EXISTS "Teachers can update their own lessons" ON public.lesson_results;
DROP POLICY IF EXISTS "Users can view lessons for their class or admin sees all" ON public.lesson_results;

-- Create proper RLS policies for lesson_results
CREATE POLICY "Admin can manage all lessons"
ON public.lesson_results
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.m_user 
    WHERE id = ((auth.uid())::text)::integer 
    AND user_group = 0
  )
);

CREATE POLICY "Teachers can manage their own lessons"
ON public.lesson_results
FOR ALL
TO authenticated
USING (
  teacher_id = ((auth.uid())::text)::integer
  AND EXISTS (
    SELECT 1 FROM public.m_user 
    WHERE id = ((auth.uid())::text)::integer 
    AND user_group = 1
  )
);

CREATE POLICY "Students can view lessons for their class"
ON public.lesson_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.m_user 
    WHERE id = ((auth.uid())::text)::integer 
    AND user_group = class_group
  )
  OR EXISTS (
    SELECT 1 FROM public.m_user 
    WHERE id = ((auth.uid())::text)::integer 
    AND user_group = 0
  )
);

-- Secure storage policies - require authentication
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to lesson files" ON storage.objects;

CREATE POLICY "Authenticated users can upload lesson files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-files'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view lesson files based on class access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-files'
  AND (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM public.m_user 
      WHERE id = ((auth.uid())::text)::integer 
      AND user_group = 0
    )
    OR
    -- Users can see files for their class
    EXISTS (
      SELECT 1 FROM public.lesson_results lr
      JOIN public.m_user u ON u.id = ((auth.uid())::text)::integer
      WHERE lr.file_path = name
      AND (u.user_group = lr.class_group OR u.user_group = 0)
    )
  )
);

CREATE POLICY "Teachers and admins can delete lesson files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-files'
  AND (
    -- Admin can delete all
    EXISTS (
      SELECT 1 FROM public.m_user 
      WHERE id = ((auth.uid())::text)::integer 
      AND user_group = 0
    )
    OR
    -- Teachers can delete their own files
    EXISTS (
      SELECT 1 FROM public.lesson_results lr
      JOIN public.m_user u ON u.id = ((auth.uid())::text)::integer
      WHERE lr.file_path = name
      AND lr.teacher_id = u.id
      AND u.user_group = 1
    )
  )
);

-- Create audit logging for security monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer REFERENCES public.m_user(id),
  event_type text NOT NULL,
  event_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.m_user 
    WHERE id = ((auth.uid())::text)::integer 
    AND user_group = 0
  )
);

-- Hash existing plaintext passwords (this is a one-time migration)
-- Note: Users will need to reset their passwords after this migration
UPDATE public.m_user 
SET user_pass = encode(digest(user_pass || 'legacy_salt', 'sha256'), 'hex')
WHERE user_pass IS NOT NULL 
AND length(user_pass) < 60; -- Only hash if not already hashed

-- Add constraint to prevent self-service admin registration
ALTER TABLE public.m_user ADD CONSTRAINT prevent_admin_self_registration 
CHECK (user_group != 0 OR user_group IS NULL);
