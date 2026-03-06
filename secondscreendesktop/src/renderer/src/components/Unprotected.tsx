import { Navigate } from 'react-router-dom'

import React from 'react'
interface Props {
  children: React.ReactNode
  isAuthenticated: boolean
}
export default function Unprotected({ children, isAuthenticated }: Props): React.ReactNode {
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
