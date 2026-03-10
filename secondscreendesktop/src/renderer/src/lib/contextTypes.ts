import { createContext } from 'react'
import { Session } from '@supabase/supabase-js'
import React from 'react'
import { User } from '@/model/User'
interface AppContextType {
  setSession: React.Dispatch<React.SetStateAction<Session | null>>
  session: Session | null
  user: User | null
  setUser: React.Dispatch<React.SetStateAction<User | null>>
}
export const AppContext = createContext<AppContextType>({
  session: null,
  setSession: () => {},
  user: null,
  setUser: () => {}
})
