
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LessonFormProps {
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  disabled?: boolean;
}

export const LessonForm = ({ 
  title, 
  description, 
  onTitleChange, 
  onDescriptionChange, 
  disabled 
}: LessonFormProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề bài học *</Label>
        <Input
          id="title"
          placeholder="Nhập tiêu đề bài học..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả bài học</Label>
        <Textarea
          id="description"
          placeholder="Nhập mô tả chi tiết về bài học..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
          rows={3}
        />
      </div>
    </>
  );
};
