
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: number;
  user_no: string;
  user_name: string | null;
  user_group: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (userNo: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra user đã đăng nhập từ localStorage
    const savedUser = localStorage.getItem('authenticated_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userNo: string, password: string) => {
    try {
      // SECURITY WARNING: This is the old insecure authentication
      // This should be migrated to proper Supabase Auth
      
      const { data, error } = await supabase
        .from('m_user')
        .select('*')
        .eq('user_no', userNo)
        .eq('user_pass', password)
        .single();

      if (error || !data) {
        return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' };
      }

      const userData: User = {
        id: data.id,
        user_no: data.user_no,
        user_name: data.user_name,
        user_group: data.user_group
      };

      
      setUser(userData);
      localStorage.setItem('authenticated_user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra khi đăng nhập' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authenticated_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
