// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './auth/useAuth'
import { AlertaProvider } from './context/AlertaContext'
import './styles/index.css'
import './styles/admin.css'
import './styles/conductor.css'
import './styles/pasajero.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AlertaProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AlertaProvider>
  </React.StrictMode>
)
