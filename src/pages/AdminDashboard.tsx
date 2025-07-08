
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, Trash2, Eye } from "lucide-react";
import { UserHeader } from "@/components/UserHeader";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, canDeleteFiles } = useUserRole();
  const [lessons, setLessons] = useState<LessonResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      if (!isAdmin) {
        toast({
          title: "Không có quyền truy cập",
          description: "Chỉ admin mới có thể truy cập trang này",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      fetchAllLessons();
    }
  }, [user, isAdmin]);

  const fetchAllLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lessons:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách bài học",
          variant: "destructive",
        });
      } else {
        setLessons(data || []);
      }
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

  const handleDownload = async (lesson: LessonResult) => {
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

  const handleDelete = async (lesson: LessonResult) => {
    if (!canDeleteFiles) {
      toast({
        title: "Không có quyền",
        description: "Bạn không có quyền xóa file",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.lesson_title}"?`)) {
      return;
    }

    try {
      // Xóa file từ storage
      const { error: storageError } = await supabase.storage
        .from('lesson-files')
        .remove([lesson.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      // Xóa record từ database
      const { error: dbError } = await supabase
        .from('lesson_results')
        .delete()
        .eq('id', lesson.id);

      if (dbError) {
        throw dbError;
      }

      toast({
        title: "Thành công",
        description: "Bài học đã được xóa",
      });

      fetchAllLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài học",
        variant: "destructive",
      });
    }
  };

  const handleView = (lessonId: string) => {
    navigate(`/lesson/${lessonId}`);
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

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Quản lý Toàn bộ Bài học - Admin
              </h1>
              <p className="text-gray-600">
                Xem và quản lý tất cả bài học từ các giáo viên
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Tất cả Bài học đã Upload</span>
                </CardTitle>
                <CardDescription>
                  {lessons.length} bài học từ tất cả các giáo viên
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Đang tải...</p>
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có bài học nào được upload</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800 mb-2">
                              {lesson.lesson_title}
                            </h3>
                            {lesson.lesson_description && (
                              <p className="text-gray-600 mb-3">
                                {lesson.lesson_description}
                              </p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                              <div>
                                <span className="font-medium">File:</span><br />
                                {lesson.file_name}
                              </div>
                              <div>
                                <span className="font-medium">Lớp:</span><br />
                                Lớp {lesson.class_group}
                              </div>
                              <div>
                                <span className="font-medium">Kích thước:</span><br />
                                {formatFileSize(lesson.file_size)}
                              </div>
                              <div>
                                <span className="font-medium">Ngày upload:</span><br />
                                {formatDate(lesson.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(lesson.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(lesson)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {canDeleteFiles && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(lesson)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
