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
  id: string
  path: string
  label: string
  pillar: string
  description: string
  icon: LucideIcon
}

/** Feasibility experiments — English only (not localized with the product UI). */
export const labs: LabDefinition[] = [
  {
    id: 'active-set',
    path: '/lab/active-set',
    label: 'Active Set Loop',
    pillar: 'Integrated',
    description:
      'Full training loop: Garmin BLE → telemetry → camera/pose → canvas composite → TV stream.',
    icon: Workflow,
  },
  {
    id: 'garmin-sync',
    path: '/lab/garmin-sync',
    label: 'Garmin BLE Channel',
    pillar: 'Pillar 2',
    description:
      'HR band via standard BLE (0x180D) or broad scan for a future Connect IQ bridge with reps/velocity.',
    icon: Bluetooth,
  },
    {
      id: 'pose',
      path: '/lab/pose',
      label: 'Camera & Pose',
      pillar: 'Pillar 3',
      description:
        'Front-camera + MediaPipe Pose Landmarker with advisory form cues (shared with session preview).',
      icon: Camera,
    },
  {
    id: 'canvas-composite',
    path: '/lab/canvas-composite',
    label: 'Canvas Compositor',
    pillar: 'Pillar 3',
    description:
      '16:9 frame with studio loop placeholder, skeleton overlay, and oversized Garmin HUD.',
    icon: Layers,
  },
  {
    id: 'cast-stream',
    path: '/lab/cast-stream',
    label: 'TV Cast Stream',
    pillar: 'Web-to-Cast',
    description:
      'canvas.captureStream at 30 FPS — AirPlay/Chromecast readiness and MediaStream pipeline.',
    icon: Tv,
  },
]

export const labHubIcon = FlaskConical
