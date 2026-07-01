import {
  BarChart3,
  Boxes,
  Dumbbell,
  FlaskConical,
  Home,
  Info,
  type LucideIcon,
  Settings,
  Share2,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

/** Primary destinations shown in the bottom navigation bar. */
export const bottomNav: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/locker', label: 'Locker', icon: Boxes },
  { to: '/history', label: 'Logboek', icon: BarChart3 },
]

/** Secondary destinations shown in the slide-in drawer. */
export const drawerNav: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/lab', label: 'Labs', icon: FlaskConical },
  { to: '/integrations', label: 'Integraties', icon: Share2 },
  { to: '/settings', label: 'Instellingen', icon: Settings },
  { to: '/about', label: 'Over SOLO.', icon: Info },
]
