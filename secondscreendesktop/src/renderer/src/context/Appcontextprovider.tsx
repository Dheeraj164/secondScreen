import { AppContext } from '@/lib/contextTypes'
import React, { JSX, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { User } from '@/model/User'

export default function Appcontextprovider({
  children
}: {
  children: React.ReactNode
}): JSX.Element {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  return (
    <AppContext.Provider value={{ session, setSession, user, setUser }}>
      {children}
    </AppContext.Provider>
  )
}
