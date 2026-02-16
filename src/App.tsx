import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { HomePage } from '@/pages/home'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { SessionEditorPage } from '@/pages/session-editor'
import { SettingsPage } from '@/pages/settings'
import { PresenterPage } from '@/pages/presenter'
import { AudiencePage } from '@/pages/audience'
import { AppLayout } from '@/components/layout/app-layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
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
  )
}
