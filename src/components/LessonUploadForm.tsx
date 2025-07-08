
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
      // Tạo tên file unique
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `class_${classGroup}/${fileName}`;

      // Upload file lên Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Lưu thông tin vào database
      const { error: dbError } = await supabase
        .from('lesson_results')
        .insert({
          teacher_id: teacherId,
          class_group: classGroup,
          lesson_title: formData.title.trim(),
          lesson_description: formData.description.trim() || null,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
        });

      if (dbError) {
        // Nếu lưu DB thất bại, xóa file đã upload
        await supabase.storage
          .from('lesson-files')
          .remove([filePath]);
        throw dbError;
      }

      onSuccess();
    } catch (error) {
      console.error('Error uploading lesson:', error);
      toast({
        title: "Lỗi",
        description: "Không thể upload bài học. Vui lòng thử lại.",
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
