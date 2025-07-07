import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video } from "lucide-react";
import { ClassList } from "@/components/ClassList";
import { VideoPlayer } from "@/components/VideoPlayer";
import { UserHeader } from "@/components/UserHeader";
import { useAuth } from "@/hooks/useAuth";

interface VideoFile {
  name: string;
  path: string;
}

interface ClassData {
  name: string;
  videos: VideoFile[];
}

const Index = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    const mockData: ClassData[] = [
      {
        name: "Lop1",
        videos: [
          { name: "video1.mp4", path: "/videos/Lop1/video1.mp4" },
          { name: "video2.mp4", path: "/videos/Lop1/video2.mp4" }
        ]
      },
      {
        name: "Lop2",
        videos: [
          { name: "video1.mp4", path: "/videos/Lop2/video1.mp4" }
        ]
      },
      {
        name: "Lop3",
        videos: [
          { name: "video1.mp4", path: "/videos/Lop3/video1.mp4" }
        ]
      }
    ];

    // Lọc các lớp theo quyền của user
    if (user) {
      // User group 0 có thể thấy tất cả lớp học
      if (user.user_group === 0) {
        setClasses(mockData);
      } else if (user.user_group) {
        // User khác chỉ thấy lớp của mình
        const userClassName = `Lop${user.user_group}`;
        const filteredClasses = mockData.filter(cls => cls.name === userClassName);
        setClasses(filteredClasses);
      } else {
        setClasses([]);
      }
    } else {
      setClasses(mockData);
    }
  }, [user]);

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setSelectedVideo(null);
  };

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setSelectedVideo(null);
  };

  const handleBackToVideos = () => {
    setSelectedVideo(null);
  };

  const getCurrentClass = () => {
    return classes.find(cls => cls.name === selectedClass);
  };

  if (selectedVideo) {
    return (
      <>
        <UserHeader />
        <VideoPlayer 
          video={selectedVideo}
          className={selectedClass || ""}
          onBack={handleBackToVideos}
        />
      </>
    );
  }

  if (selectedClass) {
    const currentClass = getCurrentClass();
    return (
      <>
        <UserHeader />
        <ClassList 
          classData={currentClass}
          onVideoSelect={handleVideoSelect}
          onBack={handleBackToClasses}
        />
      </>
    );
  }

  return (
    <>
      <UserHeader />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Hệ thống Video Học tập
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {user && user.user_group !== null
                ? user.user_group === 0 
                  ? `Chào mừng ${user.user_name || user.user_no} - Quản trị viên (Xem tất cả lớp)`
                  : `Chào mừng ${user.user_name || user.user_no} - Lớp ${user.user_group}`
                : "Chọn lớp học để xem các video bài giảng được lưu trữ cục bộ"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {classes.map((classData, index) => (
              <Card 
                key={classData.name}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
                onClick={() => handleClassSelect(classData.name)}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-gray-800 group-hover:text-blue-600 transition-colors">
                    {classData.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {classData.videos.length} video{classData.videos.length > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 group-hover:shadow-lg transition-all duration-300"
                    size="lg"
                  >
                    Xem Video
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {user ? "Bạn chưa được phân quyền vào lớp nào" : "Chưa có lớp học nào"}
              </h3>
              <p className="text-gray-500">
                {user ? "Vui lòng liên hệ quản trị viên để được cấp quyền" : "Vui lòng thêm các thư mục video vào /videos/"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
