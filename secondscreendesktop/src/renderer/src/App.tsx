import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Protected from './components/Protected'
import Home from './components/Home'
import Unprotected from './components/Unprotected'
import { useContext, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { AppContext } from './lib/contextTypes'

// import { desktopCapturer } from 'electron'

function App(): React.JSX.Element {
  const { session, setSession, setUser } = useContext(AppContext)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      if (session) {
        setSession(session)
      }
      if (event === 'SIGNED_OUT' || !session) {
        console.log(event)
        setSession(null)
        setUser(null)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
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
