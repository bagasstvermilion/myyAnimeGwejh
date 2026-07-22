import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still checking, null = confirmed logged out
  const [session, setSession] = useState(undefined)
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  // tracks this user's own presence + listens for everyone else's, so any
  // component can read live "who's online" via onlineUserIds
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setOnlineUserIds(new Set())
      return
    }

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin: session?.user?.app_metadata?.role === 'admin',
    isLoading: session === undefined,
    onlineUserIds,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
