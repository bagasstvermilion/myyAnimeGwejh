import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still checking, null = confirmed logged out
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin: session?.user?.app_metadata?.role === 'admin',
    isLoading: session === undefined,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
