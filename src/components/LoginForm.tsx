
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const LoginForm = () => {
  const [userNo, setUserNo] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userNo || !password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const result = await login(userNo, password);
    
    if (result.success) {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn trở lại!"
      });
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: result.error,
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Đăng nhập
          </CardTitle>
          <CardDescription>
            Nhập thông tin để truy cập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userNo">Tên đăng nhập</Label>
              <Input
                id="userNo"
                type="text"
                value={userNo}
                onChange={(e) => setUserNo(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
