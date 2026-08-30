import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [adminMode, setAdminMode] = useState(false);

  const refreshMember = useCallback(async (userId) => {
    if (!userId) {
      setMember(null);
      return;
    }
    const { data } = await supabase.from('miembros').select('*').eq('user_id', userId).single();
    setMember(data ?? null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      refreshMember(data.session?.user?.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      refreshMember(newSession?.user?.id);
      setLoading(false);
      if (!newSession) setAdminMode(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [refreshMember]);

  const value = {
    session,
    user: session?.user ?? null,
    member,
    refreshMember: () => refreshMember(session?.user?.id),
    adminMode: adminMode && !!member?.is_admin,
    setAdminMode,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
