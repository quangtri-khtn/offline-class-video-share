
-- Tạo storage bucket cho lesson files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-files', 'lesson-files', true);

-- Tạo bảng lesson_results để lưu thông tin bài học
CREATE TABLE public.lesson_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id INT NOT NULL REFERENCES public.m_user(id),
  class_group INT NOT NULL,
  lesson_title TEXT NOT NULL,
  lesson_description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bật Row Level Security cho bảng lesson_results
ALTER TABLE public.lesson_results ENABLE ROW LEVEL SECURITY;

-- Policy cho phép giáo viên xem bài học của lớp mình
CREATE POLICY "Teachers can view lessons of their class" 
  ON public.lesson_results 
  FOR SELECT 
  USING (class_group = (SELECT user_group FROM public.m_user WHERE id = auth.uid()::text::int));

-- Policy cho phép giáo viên tạo bài học cho lớp mình
CREATE POLICY "Teachers can create lessons for their class" 
  ON public.lesson_results 
  FOR INSERT 
  WITH CHECK (class_group = (SELECT user_group FROM public.m_user WHERE id = auth.uid()::text::int));

-- Policy cho phép giáo viên cập nhật bài học của mình
CREATE POLICY "Teachers can update their own lessons" 
  ON public.lesson_results 
  FOR UPDATE 
  USING (teacher_id = auth.uid()::text::int);

-- Policy cho phép giáo viên xóa bài học của mình
CREATE POLICY "Teachers can delete their own lessons" 
  ON public.lesson_results 
  FOR DELETE 
  USING (teacher_id = auth.uid()::text::int);

-- Tạo policy cho storage bucket
CREATE POLICY "Allow teachers to upload lesson files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'lesson-files');

CREATE POLICY "Allow teachers to view lesson files" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'lesson-files');

CREATE POLICY "Allow teachers to update lesson files" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'lesson-files');

CREATE POLICY "Allow teachers to delete lesson files" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'lesson-files');
