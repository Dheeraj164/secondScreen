import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Appcontextprovider from './context/Appcontextprovider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Appcontextprovider>
      <App />
    </Appcontextprovider>
  </StrictMode>
)
