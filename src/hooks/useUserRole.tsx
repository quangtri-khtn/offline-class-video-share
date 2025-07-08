
import { useAuth } from "@/hooks/useAuth";

export const useUserRole = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.user_group === 0;
  const isTeacher = user?.user_group === 1;
  const isStudent = user?.user_group === 2;
  
  const canViewAllFiles = isAdmin;
  const canViewOwnFiles = isTeacher || isAdmin;
  const canDeleteFiles = isAdmin;
  
  return {
    user,
    isAdmin,
    isTeacher,
    isStudent,
    canViewAllFiles,
    canViewOwnFiles,
    canDeleteFiles,
    userRole: user?.user_group || null
  };
};
