import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Eye, EyeOff } from "lucide-react";
import { UserHeader } from "@/components/UserHeader";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LessonResult {
  id: string;
  lesson_title: string;
  lesson_description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
  teacher_id: number;
  class_group: number;
}

const LessonViewer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, canViewAllFiles, canViewOwnFiles, userRole } = useUserRole();
  const [lesson, setLesson] = useState<LessonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchLesson();
    }
  }, [user, id]);

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_results')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching lesson:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin bài học",
          variant: "destructive",
        });
        return;
      }

      // Kiểm tra quyền xem
      if (userRole === 2) {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn không có quyền xem nội dung này",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (!canViewAllFiles && data.teacher_id !== user?.id) {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn chỉ có thể xem bài học của chính mình",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setLesson(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!lesson) return;

    try {
      const { data, error } = await supabase.storage
        .from('lesson-files')
        .download(lesson.file_path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = lesson.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải file xuống",
        variant: "destructive",
      });
    }
  };

  const handlePreview = async () => {
    if (!lesson) return;

    try {
      const { data } = await supabase.storage
        .from('lesson-files')
        .getPublicUrl(lesson.file_path);

      setFileUrl(data.publicUrl);
      setShowPreview(!showPreview);
    } catch (error) {
      console.error('Error getting file URL:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xem trước file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <>
        <UserHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <UserHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài học</h1>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại trang chủ
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Chi tiết Bài học
              </h1>
              <p className="text-gray-600">
                Xem nội dung và thông tin chi tiết bài học
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{lesson.lesson_title}</span>
                </CardTitle>
                <CardDescription>
                  Lớp {lesson.class_group} • {formatDate(lesson.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lesson.lesson_description && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Mô tả:</h3>
                      <p className="text-gray-600">{lesson.lesson_description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">File:</span><br />
                      <span className="text-gray-600">{lesson.file_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Loại:</span><br />
                      <span className="text-gray-600">{lesson.file_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Kích thước:</span><br />
                      <span className="text-gray-600">{formatFileSize(lesson.file_size)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Lớp:</span><br />
                      <span className="text-gray-600">Lớp {lesson.class_group}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handlePreview}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Ẩn xem trước
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Xem trước
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Tải xuống
                    </Button>
                  </div>

                  {showPreview && fileUrl && (
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-800 mb-4">Xem trước nội dung:</h3>
                      <div className="border rounded-lg overflow-hidden">
                        {lesson.file_type === 'application/pdf' ? (
                          <iframe
                            src={fileUrl}
                            className="w-full h-96"
                            title="PDF Preview"
                          />
                        ) : (
                          <div className="p-8 text-center bg-gray-50">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                              Không thể xem trước file Word. Vui lòng tải xuống để xem nội dung.
                            </p>
                            <Button
                              onClick={handleDownload}
                              className="mt-4"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Tải xuống file
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default LessonViewer;
