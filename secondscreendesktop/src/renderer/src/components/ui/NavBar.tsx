import { AppContext } from '@/lib/contextTypes'
import { supabase } from '@/lib/supabase'
import { JSX, useContext } from 'react'
import { statusType } from '../Home'

export default function NavBar({ status }: { status: statusType }): JSX.Element {
  const { user } = useContext(AppContext)

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
      <h1 className="text-xl font-semibold">SecondScreen</h1>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Status:</span>
        <span
          className={`px-2 py-1 text-xs rounded ${
            status === 'Idle'
              ? 'bg-gray-700'
              : status === 'Waiting'
                ? 'bg-yellow-600'
                : 'bg-green-600'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden md:block text-sm text-gray-300 truncate max-w-50">{user?.email}</p>

        <button
          onClick={async () => {
            console.log('Clicked on signout')

            const { error } = await supabase.auth.signOut()

            if (error) {
              console.error(error)
            } else {
              console.log('Logged out successfully')
            }
          }}
          className="bg-red-700 hover:bg-red-600 rounded-lg px-3 py-1 text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
