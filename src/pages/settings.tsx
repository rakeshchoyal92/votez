import { useAuth } from '@/contexts/auth-context'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function SettingsPage() {
  const { user } = useAuth()

  const userName = user?.user_metadata?.full_name ?? user?.email ?? ''
  const userEmail = user?.email ?? ''
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account
        </p>
      </div>

      <Card className="border-border/50">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
            Account
          </h2>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{userName}</p>
              {userEmail && userName !== userEmail && (
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
