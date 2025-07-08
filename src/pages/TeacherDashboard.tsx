
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileText, Download, Trash2 } from "lucide-react";
import { UserHeader } from "@/components/UserHeader";
import { useAuth } from "@/hooks/useAuth";
import { LessonUploadForm } from "@/components/LessonUploadForm";
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
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<LessonResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_results')
        .select('*')
        .eq('teacher_id', user?.id)
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

  const handleLessonUploaded = () => {
    setShowUploadForm(false);
    fetchLessons();
    toast({
      title: "Thành công",
      description: "Bài học đã được upload thành công",
    });
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

      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa bài học",
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

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Quản lý Bài học - Lớp {user.user_group}
                </h1>
                <p className="text-gray-600">
                  Upload và quản lý kết quả bài học của bạn
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowUploadForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Bài học
            </Button>
          </div>

          {showUploadForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Upload Kết quả Bài học</CardTitle>
                <CardDescription>
                  Upload file Word hoặc PDF chứa kết quả bài học của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LessonUploadForm
                  onSuccess={handleLessonUploaded}
                  onCancel={() => setShowUploadForm(false)}
                  teacherId={user.id}
                  classGroup={user.user_group || 0}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Danh sách Bài học đã Upload</span>
                </CardTitle>
                <CardDescription>
                  {lessons.length} bài học đã được upload
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
                    <Button
                      onClick={() => setShowUploadForm(true)}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Bài học đầu tiên
                    </Button>
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
                                <span className="font-medium">Loại:</span><br />
                                {lesson.file_type || 'N/A'}
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
                              onClick={() => handleDownload(lesson)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(lesson)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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

export default TeacherDashboard;
