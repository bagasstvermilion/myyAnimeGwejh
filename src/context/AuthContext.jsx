import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import BannedNotice from '../components/dialog/BannedNotice'

const AuthContext = createContext(null)

const SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000 // 3 jam sejak aktivitas terakhir
const LAST_ACTIVITY_KEY = 'session_last_activity'
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll']
const ACTIVITY_THROTTLE_MS = 30 * 1000 // gak perlu nulis localStorage tiap event

export function AuthProvider({ children }) {
  // undefined = still checking, null = confirmed logged out
  const [session, setSession] = useState(undefined)
  const [onlineUserIds, setOnlineUserIds] = useState(new Set())
  const [bannedNotice, setBannedNotice] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_IN') {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(LAST_ACTIVITY_KEY)
      }
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  // force sign-out after 3 hours of no activity (Supabase's own
  // "Inactivity timeout" setting needs a paid plan). Any click/keypress/
  // scroll/touch refreshes the clock, so it only fires once the user's
  // genuinely been idle — including "closed the tab and came back a day
  // later" once that idle gap crosses 3 hours.
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    function markActive() {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }

    function checkExpiry() {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
      if (!lastActivity) {
        markActive()
        return
      }
      if (Date.now() - lastActivity > SESSION_MAX_AGE_MS) {
        supabase.auth.signOut()
      }
    }

    checkExpiry()

    let lastMarked = Date.now()
    function handleActivity() {
      const now = Date.now()
      if (now - lastMarked < ACTIVITY_THROTTLE_MS) return
      lastMarked = now
      markActive()
    }

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleActivity, { passive: true }),
    )
    const interval = setInterval(checkExpiry, 60 * 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleActivity),
      )
      clearInterval(interval)
    }
  }, [session?.user?.id])

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
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())))
      })
      .on('broadcast', { event: 'user-banned' }, ({ payload }) => {
        if (payload.userId === userId) {
          setBannedNotice({ reason: payload.reason, duration: payload.duration })
          supabase.auth.signOut()
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  function broadcastUserBanned(userId, { reason, duration } = {}) {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'user-banned',
      payload: { userId, reason, duration },
    })
  }

  const value = {
    session,
    user: session?.user ?? null,
    role: session?.user?.app_metadata?.role ?? 'user',
    isAdmin: ['admin', 'moderator'].includes(session?.user?.app_metadata?.role),
    isLoading: session === undefined,
    onlineUserIds,
    broadcastUserBanned,
    signOut: () => supabase.auth.signOut(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <BannedNotice details={bannedNotice} onClose={() => setBannedNotice(null)} />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
