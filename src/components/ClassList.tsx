
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Video } from "lucide-react";

interface VideoFile {
  name: string;
  path: string;
}

interface ClassData {
  name: string;
  videos: VideoFile[];
}

interface ClassListProps {
  classData: ClassData | undefined;
  onVideoSelect: (video: VideoFile) => void;
  onBack: () => void;
}

export const ClassList = ({ classData, onVideoSelect, onBack }: ClassListProps) => {
  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Không tìm thấy lớp học</h2>
          <Button onClick={onBack} className="bg-gradient-to-r from-blue-500 to-purple-500">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            onClick={onBack}
            variant="outline"
            className="mb-6 hover:bg-blue-50 border-blue-200"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Quay lại danh sách lớp
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {classData.name}
            </h1>
            <p className="text-xl text-gray-600">
              {classData.videos.length} video bài giảng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {classData.videos.map((video, index) => (
            <Card 
              key={video.path}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
              onClick={() => onVideoSelect(video)}
            >
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800 group-hover:text-blue-600 transition-colors">
                  Video {index + 1}
                </CardTitle>
                <CardDescription className="text-gray-600 break-all">
                  {video.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 group-hover:shadow-lg transition-all duration-300"
                  size="lg"
                >
                  Phát Video
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {classData.videos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Chưa có video nào
            </h3>
            <p className="text-gray-500">
              Vui lòng thêm video vào thư mục {classData.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
