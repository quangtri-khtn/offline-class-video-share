
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LessonForm } from "./lesson-upload/LessonForm";
import { FileSelector } from "./lesson-upload/FileSelector";
import { uploadLessonFile } from "./lesson-upload/UploadService";

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
      await uploadLessonFile(
        selectedFile,
        teacherId,
        classGroup,
        formData.title,
        formData.description
      );
      
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LessonForm
        title={formData.title}
        description={formData.description}
        onTitleChange={(title) => setFormData({ ...formData, title })}
        onDescriptionChange={(description) => setFormData({ ...formData, description })}
        disabled={loading}
      />

      <FileSelector
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
        disabled={loading}
      />

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
