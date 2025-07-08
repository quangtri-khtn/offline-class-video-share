
import { supabase } from "@/integrations/supabase/client";

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
  console.log('Starting upload process...');
  console.log('Original file name:', file.name);
  console.log('File size:', file.size);
  console.log('File type:', file.type);
  console.log('Teacher ID:', teacherId);
  console.log('Class group:', classGroup);

  // Tạo tên file an toàn
  const safeFileName = createSafeFileName(file.name);
  const fileName = `${Date.now()}_${safeFileName}`;
  const filePath = `class_${classGroup}/${fileName}`;

  console.log('Safe file name:', safeFileName);
  console.log('Final file name:', fileName);
  console.log('File path:', filePath);

  // Upload file lên Supabase Storage
  console.log('Uploading to storage...');
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('lesson-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  console.log('Upload successful:', uploadData);

  // Lưu thông tin vào database
  console.log('Saving to database...');
  const { error: dbError, data: dbData } = await supabase
    .from('lesson_results')
    .insert({
      teacher_id: teacherId,
      class_group: classGroup,
      lesson_title: title.trim(),
      lesson_description: description.trim() || null,
      file_name: file.name, // Giữ tên gốc để hiển thị
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
    });

  if (dbError) {
    console.error('Database insert error:', dbError);
    // Nếu lưu DB thất bại, xóa file đã upload
    await supabase.storage
      .from('lesson-files')
      .remove([filePath]);
    throw dbError;
  }

  console.log('Database insert successful:', dbData);
  return { uploadData, dbData };
};
