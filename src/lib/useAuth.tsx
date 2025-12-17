import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Check for custom user first
      const customUserStr = localStorage.getItem('custom_user');
      if (customUserStr) {
        try {
          const customUser = JSON.parse(customUserStr);
          setUser(customUser);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Error parsing custom user", e);
          localStorage.removeItem('custom_user');
        }
      }

      // Fallback to Supabase auth
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data?.session?.user ?? null);
      } catch (error) {
        console.error("Error getting session", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update if not using custom user
      if (!localStorage.getItem('custom_user')) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for storage changes (for custom auth logout/login across tabs)
    const handleStorageChange = () => {
      checkUser();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      listener?.subscription?.unsubscribe?.();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { user, loading };
}

export default useAuth;
