import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Protected from './components/Protected'
import Home from './components/Home'
import Unprotected from './components/Unprotected'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

// import { desktopCapturer } from 'electron'

function App(): React.JSX.Element {
  const [isAuthenticated, setisAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setisAuthenticated(true)
      }
      if (event === 'SIGNED_OUT') setisAuthenticated(false)
    })
  }, [])
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Unprotected isAuthenticated={isAuthenticated}>
              <Login />
            </Unprotected>
          }
        />

        <Route
          path="/"
          element={
            <Protected isAuthenticated={isAuthenticated}>
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
