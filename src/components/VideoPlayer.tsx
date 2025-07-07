
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Video } from "lucide-react";

interface VideoFile {
  name: string;
  path: string;
}

interface VideoPlayerProps {
  video: VideoFile;
  className: string;
  onBack: () => void;
}

export const VideoPlayer = ({ video, className, onBack }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setVideoError(false);
    setIsLoading(true);
  }, [video.path]);

  const handleVideoLoad = () => {
    setIsLoading(false);
    setVideoError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setVideoError(true);
    console.error("Could not load video:", video.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            onClick={onBack}
            variant="outline"
            className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Quay lại danh sách video
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              {className} - {video.name}
            </h1>
            <p className="text-gray-300">
              Video bài giảng
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="bg-black/50 border-gray-700">
            <CardContent className="p-0">
              {isLoading && (
                <div className="aspect-video bg-gray-800 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white">Đang tải video...</p>
                  </div>
                </div>
              )}
              
              {videoError ? (
                <div className="aspect-video bg-gray-800 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Video className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Không thể tải video
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Không tìm thấy file: {video.path}
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Hướng dẫn khắc phục:</p>
                      <p>1. Đảm bảo file video tồn tại trong thư mục chỉ định</p>
                      <p>2. Kiểm tra đường dẫn file có chính xác không</p>
                      <p>3. Đảm bảo định dạng video được hỗ trợ (.mp4, .webm, .ogg)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full aspect-video rounded-lg"
                  controls
                  onLoadedData={handleVideoLoad}
                  onError={handleVideoError}
                  style={{ display: isLoading ? 'none' : 'block' }}
                >
                  <source src={video.path} type="video/mp4" />
                  <source src={video.path} type="video/webm" />
                  <source src={video.path} type="video/ogg" />
                  Trình duyệt của bạn không hỗ trợ phát video.
                </video>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Đường dẫn: {video.path}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
