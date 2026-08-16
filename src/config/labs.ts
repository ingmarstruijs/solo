import {
  Bluetooth,
  Camera,
  FlaskConical,
  Layers,
  Tv,
  type LucideIcon,
  Workflow,
} from 'lucide-react'

export type LabDefinition = {
  id: 'active-set' | 'garmin-sync' | 'pose' | 'canvas-composite' | 'cast-stream'
  path: string
  icon: LucideIcon
}

/** Feasibility experiments — each maps to a slice of the SOLO. architecture. */
export const labs: LabDefinition[] = [
  {
    id: 'active-set',
    path: '/lab/active-set',
    icon: Workflow,
  },
  {
    id: 'garmin-sync',
    path: '/lab/garmin-sync',
    icon: Bluetooth,
  },
  {
    id: 'pose',
    path: '/lab/pose',
    icon: Camera,
  },
  {
    id: 'canvas-composite',
    path: '/lab/canvas-composite',
    icon: Layers,
  },
  {
    id: 'cast-stream',
    path: '/lab/cast-stream',
    icon: Tv,
  },
]

export const labHubIcon = FlaskConical
