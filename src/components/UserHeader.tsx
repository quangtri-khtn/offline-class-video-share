
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const UserHeader = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getClassName = (userGroup: number | null) => {
    if (userGroup === 1) return 'Lop1';
    if (userGroup === 2) return 'Lop2';
    if (userGroup === 3) return 'Lop3';
    return 'Chưa phân lớp';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">
              {user.user_name || user.user_no}
            </p>
            <p className="text-sm text-gray-600">
              Lớp: {getClassName(user.user_group)}
            </p>
          </div>
        </div>
        <Button 
          onClick={logout}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </div>
  );
};
