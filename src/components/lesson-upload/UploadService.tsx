
import { supabase } from "@/integrations/supabase/client";
import { validateFileUpload, sanitizeInput } from "@/components/input-validation/ValidationUtils";

export const createSafeFileName = (originalName: string): string => {
  // Loại bỏ ký tự đặc biệt và thay thế bằng underscore
  const safeName = originalName
    .normalize('NFD') // Chuẩn hóa Unicode
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Thay thế ký tự đặc biệt bằng _
    .replace(/_+/g, '_') // Gộp nhiều _ thành 1
    .replace(/^_|_$/g, ''); // Loại bỏ _ ở đầu và cuối
  
  return safeName;
};

export const uploadLessonFile = async (
  file: File,
  teacherId: number,
  classGroup: number,
  title: string,
  description: string
) => {
  // Validate inputs
  const validation = validateFileUpload(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const sanitizedTitle = sanitizeInput(title);
  const sanitizedDescription = sanitizeInput(description);

  if (!sanitizedTitle) {
    throw new Error('Tiêu đề không được để trống');
  }

  // Tạo tên file an toàn
  const safeFileName = createSafeFileName(file.name);
  const fileName = `${Date.now()}_${safeFileName}`;
  const filePath = `class_${classGroup}/${fileName}`;

  // Upload file lên Supabase Storage
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('lesson-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  // Lưu thông tin vào database
  const { error: dbError, data: dbData } = await supabase
    .from('lesson_results')
    .insert({
      teacher_id: teacherId,
      class_group: classGroup,
      lesson_title: sanitizedTitle,
      lesson_description: sanitizedDescription || null,
      file_name: file.name, // Giữ tên gốc để hiển thị
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
    });

  if (dbError) {
    // Nếu lưu DB thất bại, xóa file đã upload
    await supabase.storage
      .from('lesson-files')
      .remove([filePath]);
    throw dbError;
  }

  return { uploadData, dbData };
};
