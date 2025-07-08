
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LessonUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  teacherId: number;
  classGroup: number;
}

export const LessonUploadForm = ({ onSuccess, onCancel, teacherId, classGroup }: LessonUploadFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file PDF, DOC hoặc DOCX",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "File không được vượt quá 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  // Hàm tạo tên file an toàn
  const createSafeFileName = (originalName: string): string => {
    // Loại bỏ ký tự đặc biệt và thay thế bằng underscore
    const safeName = originalName
      .normalize('NFD') // Chuẩn hóa Unicode
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Thay thế ký tự đặc biệt bằng _
      .replace(/_+/g, '_') // Gộp nhiều _ thành 1
      .replace(/^_|_$/g, ''); // Loại bỏ _ ở đầu và cuối
    
    return safeName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file để upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề bài học",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Starting upload process...');
      console.log('Original file name:', selectedFile.name);
      console.log('File size:', selectedFile.size);
      console.log('File type:', selectedFile.type);
      console.log('Teacher ID:', teacherId);
      console.log('Class group:', classGroup);

      // Tạo tên file an toàn
      const safeFileName = createSafeFileName(selectedFile.name);
      const fileName = `${Date.now()}_${safeFileName}`;
      const filePath = `class_${classGroup}/${fileName}`;

      console.log('Safe file name:', safeFileName);
      console.log('Final file name:', fileName);
      console.log('File path:', filePath);

      // Upload file lên Supabase Storage
      console.log('Uploading to storage...');
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, selectedFile, {
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
          lesson_title: formData.title.trim(),
          lesson_description: formData.description.trim() || null,
          file_name: selectedFile.name, // Giữ tên gốc để hiển thị
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
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
      
      toast({
        title: "Thành công",
        description: "Bài học đã được upload thành công",
      });

      onSuccess();
    } catch (error) {
      console.error('Error uploading lesson:', error);
      
      let errorMessage = "Không thể upload bài học. Vui lòng thử lại.";
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage += ` Chi tiết: ${error.message}`;
        }
        if ('error' in error) {
          errorMessage += ` Lỗi: ${error.error}`;
        }
      }
      
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề bài học *</Label>
        <Input
          id="title"
          placeholder="Nhập tiêu đề bài học..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả bài học</Label>
        <Textarea
          id="description"
          placeholder="Nhập mô tả chi tiết về bài học..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File bài học * (PDF, DOC, DOCX)</Label>
        <div className="space-y-4">
          <Input
            id="file"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            disabled={loading}
          />
          
          {selectedFile && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={loading || !selectedFile}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Đang upload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Bài học
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
