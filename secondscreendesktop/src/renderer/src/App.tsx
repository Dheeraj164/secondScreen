import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Protected from './components/Protected'
import Home from './components/Home'
import Unprotected from './components/Unprotected'
import { useContext, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { AppContext } from './lib/contextTypes'
import { User } from './model/User'

// import { desktopCapturer } from 'electron'

async function getUser(id: string): Promise<User | null | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('id', id)
    .single()
  if (data) {
    console.log(data)
    return new User({
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name
    })
  }
  if (error) return null
}

function App(): React.JSX.Element {
  const { session, setSession, setUser } = useContext(AppContext)
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setSession(session)
        console.log(session)
        const data = await getUser(session.user.id)
        if (data) {
          console.log(data.id)
          setUser(data)
        }
      }
      if (event === 'SIGNED_OUT' || !session) {
        setSession(null)
        setUser(null)
      }
    })
  }, [setSession, setUser])
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Unprotected isAuthenticated={session ? true : false}>
              <Login />
            </Unprotected>
          }
        />

        <Route
          path="/"
          element={
            <Protected isAuthenticated={session ? true : false}>
              <Home />
            </Protected>
          }
        />

        {/* <Route
          path="/settings"
          element={
            <Protected isAuthenticated={isAuthenticated}>
              <Settings />
            </Protected>
          }
        /> */}
      </Routes>
    </HashRouter>
  )
}

export default App

{
  /*
  <Routes>
    <Activity mode={userSession ? 'hidden' : 'visible'}>
      <Route path="/login" element={<Login />} />
      <Route path="/login" element={<Signup />} />
    </Activity>

    <Activity mode={!userSession ? 'hidden' : 'visible'}>
      <Route path="/" element={<Home />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/capture" element={<Capture />} />
    </Activity>
  </Routes>
  */
}
