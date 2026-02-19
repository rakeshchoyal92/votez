import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'
import '@fontsource/geist-sans/400.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/geist-sans/600.css'
import '@fontsource/geist-sans/700.css'
import '@fontsource/geist-sans/800.css'
import App from './App'
import './index.css'

// Swap favicon in dev mode (orange) vs prod (indigo)
if (import.meta.env.DEV) {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link) link.href = '/favicon-dev.svg'
}

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
