
// Enhanced input validation utilities for security

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .substring(0, 255); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  // Allowed file types with stricter validation
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/webm',
    'video/ogg'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Loại file không được phép. Chỉ chấp nhận PDF, DOC, DOCX, MP4, WEBM, OGG.' };
  }

  // Max file size: 500MB for videos, 50MB for documents
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
  
  if (file.size > maxSize) {
    const maxSizeMB = isVideo ? 500 : 50;
    return { valid: false, error: `File quá lớn (tối đa ${maxSizeMB}MB)` };
  }

  // Check for suspicious file names and patterns
  const suspiciousPatterns = [
    '.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.com',
    '.pif', '.application', '.gadget', '.msi', '.msp', '.hta'
  ];
  
  const fileName = file.name.toLowerCase();
  
  for (const pattern of suspiciousPatterns) {
    if (fileName.includes(pattern)) {
      return { valid: false, error: 'Tên file chứa phần mở rộng không được phép' };
    }
  }

  // Check for null bytes and other dangerous characters
  if (fileName.includes('\0') || fileName.includes('..')) {
    return { valid: false, error: 'Tên file chứa ký tự không hợp lệ' };
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

  // Enhanced SQL injection and XSS prevention
  const dangerousPatterns = [
    /(union|select|insert|update|delete|drop|exec|script|alert|eval|expression)/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return { valid: false, error: 'Dữ liệu đầu vào chứa nội dung không được phép' };
    }
  }

  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { valid: false, error: 'Mật khẩu phải chứa ít nhất một chữ cái thường, một chữ cái hoa và một số' };
  }

  return { valid: true };
};

// Rate limiting for security-sensitive operations
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number = 5, windowMs: number = 900000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};
