import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface CustomUser extends User {
  user_group?: number;
  user_name?: string;
  user_no?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  signUp: (email: string, password: string, userData: { user_no: string; user_name: string; user_group: number }) => Promise<{ error?: any }>;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Fetch additional user data from m_user table
          const { data: userData } = await supabase
            .from('m_user')
            .select('user_group, user_name, user_no')
            .eq('id', parseInt(session.user.id))
            .single();
          
          setUser({
            ...session.user,
            ...userData
          });
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        // The onAuthStateChange will handle setting the user
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: { user_no: string; user_name: string; user_group: number }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    if (!error && data.user) {
      // Create user record in m_user table
      const { error: insertError } = await supabase
        .from('m_user')
        .insert({
          user_no: userData.user_no,
          user_name: userData.user_name,
          user_group: userData.user_group,
          user_pass: '', // No longer storing plaintext passwords
          status: 'active'
        });
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};