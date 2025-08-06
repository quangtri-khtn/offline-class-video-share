
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";

export const useSecurityMonitoring = () => {
  const { user } = useSupabaseAuth();

  const logSecurityEvent = async (
    eventType: string,
    eventData: any = {},
    severity: 'low' | 'medium' | 'high' = 'low'
  ) => {
    try {
      await supabase
        .from('audit_log')
        .insert({
          user_id: user?.id || null,
          action: eventType,
          table_name: 'security_events',
          record_id: null,
          new_values: {
            ...eventData,
            severity,
            timestamp: new Date().toISOString()
          },
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const logLoginAttempt = (success: boolean, error?: string) => {
    logSecurityEvent('login_attempt', {
      success,
      error: error || null,
      user_id: user?.id || null
    }, success ? 'low' : 'medium');
  };

  const logUnauthorizedAccess = (resource: string, attemptedAction: string) => {
    logSecurityEvent('unauthorized_access', {
      resource,
      attempted_action: attemptedAction,
      user_id: user?.id || null
    }, 'high');
  };

  const logSuspiciousActivity = (activity: string, details: any) => {
    logSecurityEvent('suspicious_activity', {
      activity,
      details,
      user_id: user?.id || null
    }, 'high');
  };

  return {
    logSecurityEvent,
    logLoginAttempt,
    logUnauthorizedAccess,
    logSuspiciousActivity
  };
};
