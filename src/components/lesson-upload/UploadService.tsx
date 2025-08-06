
import { supabase } from "@/integrations/supabase/client";
import { validateFileUpload, sanitizeInput, checkRateLimit } from "@/components/input-validation/ValidationUtils";

export const createSafeFileName = (originalName: string): string => {
  // Enhanced file name sanitization
  const safeName = originalName
    .normalize('NFD') // Unicode normalization
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Merge multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length
  
  return safeName;
};

const logSecurityEvent = async (eventType: string, eventData: any, userId?: number) => {
  try {
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        user_agent: navigator.userAgent
      });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

export const uploadLessonFile = async (
  file: File,
  teacherId: number,
  classGroup: number,
  title: string,
  description: string
) => {
  // Rate limiting check
  const rateLimitKey = `upload_${teacherId}`;
  if (!checkRateLimit(rateLimitKey, 10, 3600000)) { // 10 uploads per hour
    throw new Error('Quá nhiều lần upload. Vui lòng thử lại sau 1 giờ.');
  }

  // Validate inputs
  const validation = validateFileUpload(file);
  if (!validation.valid) {
    await logSecurityEvent('file_upload_rejected', {
      filename: file.name,
      reason: validation.error,
      teacher_id: teacherId
    }, teacherId);
    throw new Error(validation.error);
  }

  const sanitizedTitle = sanitizeInput(title);
  const sanitizedDescription = sanitizeInput(description);

  if (!sanitizedTitle) {
    throw new Error('Tiêu đề không được để trống');
  }

  // Additional security checks
  if (sanitizedTitle.length > 200) {
    throw new Error('Tiêu đề không được vượt quá 200 ký tự');
  }

  if (sanitizedDescription && sanitizedDescription.length > 1000) {
    throw new Error('Mô tả không được vượt quá 1000 ký tự');
  }

  // Create safe file name with additional entropy
  const safeFileName = createSafeFileName(file.name);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `${timestamp}_${randomSuffix}_${safeFileName}`;
  const filePath = `class_${classGroup}/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('lesson-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      await logSecurityEvent('file_upload_failed', {
        filename: fileName,
        error: uploadError.message,
        teacher_id: teacherId
      }, teacherId);
      throw uploadError;
    }

    // Save information to database
    const { error: dbError, data: dbData } = await supabase
      .from('lesson_results')
      .insert({
        teacher_id: teacherId,
        class_group: classGroup,
        lesson_title: sanitizedTitle,
        lesson_description: sanitizedDescription || null,
        file_name: file.name, // Keep original name for display
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      // If DB save fails, delete the uploaded file
      await supabase.storage
        .from('lesson-files')
        .remove([filePath]);

      await logSecurityEvent('lesson_create_failed', {
        filename: fileName,
        error: dbError.message,
        teacher_id: teacherId
      }, teacherId);
      throw dbError;
    }

    // Log successful upload
    await logSecurityEvent('lesson_uploaded', {
      lesson_id: dbData.id,
      filename: fileName,
      class_group: classGroup,
      teacher_id: teacherId
    }, teacherId);

    return { uploadData, dbData };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
