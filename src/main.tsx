import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL

if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL environment variable')
}

const convex = new ConvexReactClient(convexUrl)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <BrowserRouter>
            <NuqsAdapter>
              <App />
              <Toaster position="top-center" richColors />
            </NuqsAdapter>
          </BrowserRouter>
        </AuthProvider>
      </ConvexProvider>
    </ThemeProvider>
  </React.StrictMode>
)
