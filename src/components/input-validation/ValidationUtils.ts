// Input validation utilities for security

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 255); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/avi',
    'video/webm'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Loại file không được phép' };
  }

  // Max file size: 500MB
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File quá lớn (tối đa 500MB)' };
  }

  // Check for suspicious file names
  const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
  const fileName = file.name.toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (fileName.includes(pattern)) {
      return { valid: false, error: 'Tên file không hợp lệ' };
    }
  }

  return { valid: true };
};

export const validateUserInput = (input: string, maxLength: number = 255): { valid: boolean; error?: string } => {
  if (!input || input.trim().length === 0) {
    return { valid: false, error: 'Trường này không được để trống' };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `Không được vượt quá ${maxLength} ký tự` };
  }

  // Check for potential SQL injection patterns
  const sqlPatterns = /(union|select|insert|update|delete|drop|exec|script)/i;
  if (sqlPatterns.test(input)) {
    return { valid: false, error: 'Dữ liệu đầu vào không hợp lệ' };
  }

  return { valid: true };
};