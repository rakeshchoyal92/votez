import { Link } from 'react-router-dom'
import { Vote } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizes = {
  sm: { box: 'w-6 h-6 rounded-md', icon: 'w-3 h-3', text: 'text-base' },
  md: { box: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5', text: 'text-lg' },
  lg: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', text: 'text-2xl' },
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  to?: string
  className?: string
}

export function Logo({ size = 'md', to = '/', className }: LogoProps) {
  const s = sizes[size]

  const content = (
    <>
      <div
        className={cn(
          s.box,
          'bg-primary flex items-center justify-center transition-transform group-hover:scale-105'
        )}
      >
        <Vote className={cn(s.icon, 'text-primary-foreground')} />
      </div>
      <span className={cn(s.text, 'font-bold text-foreground')}>Votez</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={cn('flex items-center gap-2 group', className)}>
        {content}
      </Link>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {content}
    </div>
  )
}
