import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'

const HomePage = React.lazy(() => import('@/pages/home').then(m => ({ default: m.HomePage })))
const LoginPage = React.lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })))
const DashboardPage = React.lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })))
const SessionEditorPage = React.lazy(() => import('@/pages/session-editor').then(m => ({ default: m.SessionEditorPage })))
const SettingsPage = React.lazy(() => import('@/pages/settings').then(m => ({ default: m.SettingsPage })))
const PresenterPage = React.lazy(() => import('@/pages/presenter').then(m => ({ default: m.PresenterPage })))
const AudiencePage = React.lazy(() => import('@/pages/audience').then(m => ({ default: m.AudiencePage })))

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join/:code" element={<AudiencePage />} />

        {/* Protected routes with shared nav */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/session/:sessionId" element={<SessionEditorPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Protected routes (immersive, own nav) */}
        <Route
          path="/present/:sessionId"
          element={
            <ProtectedRoute>
              <PresenterPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
