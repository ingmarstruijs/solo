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
  /** i18n key under the `nav` namespace */
  labelKey: 'home' | 'workouts' | 'locker' | 'history' | 'labs' | 'integrations' | 'settings' | 'about'
  icon: LucideIcon
}

/** Primary destinations shown in the bottom navigation bar. */
export const bottomNav: NavItem[] = [
  { to: '/', labelKey: 'home', icon: Home },
  { to: '/workouts', labelKey: 'workouts', icon: Dumbbell },
  { to: '/locker', labelKey: 'locker', icon: Boxes },
  { to: '/history', labelKey: 'history', icon: BarChart3 },
]

/** Secondary destinations shown in the slide-in drawer. */
export const drawerNav: NavItem[] = [
  { to: '/', labelKey: 'home', icon: Home },
  { to: '/lab', labelKey: 'labs', icon: FlaskConical },
  { to: '/integrations', labelKey: 'integrations', icon: Share2 },
  { to: '/settings', labelKey: 'settings', icon: Settings },
  { to: '/about', labelKey: 'about', icon: Info },
]
