'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'

type NavRoute =
  | '/dashboard'
  | '/dashboard/students'
  | '/dashboard/workouts'
  | '/dashboard/exercises'
  | '/dashboard/billing'
  | '/dashboard/settings'

const navItems: { href: NavRoute; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/students', label: 'Alunos', icon: Users },
  { href: '/dashboard/workouts', label: 'Treinos', icon: Dumbbell },
  { href: '/dashboard/exercises', label: 'Exercícios', icon: BookOpen },
  { href: '/dashboard/billing', label: 'Cobrança', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-16 items-center border-b border-neutral-100 px-5">
        <span className="text-lg font-bold text-blue-600">AthletiQLab</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-100 p-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
