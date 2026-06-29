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

/** Feasibility experiments — each maps to a slice of the SOLO. architecture. */
export const labs: LabDefinition[] = [
  {
    id: 'active-set',
    path: '/lab/active-set',
    label: 'Active Set Loop',
    pillar: 'Geïntegreerd',
    description:
      'Volledige training-loop: Garmin BLE → telemetrie → camera/pose → canvas composite → TV-stream.',
    icon: Workflow,
  },
  {
    id: 'garmin-sync',
    path: '/lab/garmin-sync',
    label: 'Garmin BLE Channel',
    pillar: 'Pillar 2',
    description:
      'HR-band via standaard BLE (0x180D) of brede scan voor toekomstige Connect IQ-bridge met reps/velocity.',
    icon: Bluetooth,
  },
  {
    id: 'pose',
    path: '/lab/pose',
    label: 'Camera & Pose',
    pillar: 'Pillar 3',
    description:
      'Front-camera toegang en GPU/Wasm-readiness voor MediaPipe Pose Landmarker.',
    icon: Camera,
  },
  {
    id: 'canvas-composite',
    path: '/lab/canvas-composite',
    label: 'Canvas Compositor',
    pillar: 'Pillar 3',
    description:
      '16:9 frame met studio loop-placeholder, skeleton overlay en oversized Garmin HUD.',
    icon: Layers,
  },
  {
    id: 'cast-stream',
    path: '/lab/cast-stream',
    label: 'TV Cast Stream',
    pillar: 'Web-to-Cast',
    description:
      'canvas.captureStream op 30 FPS — AirPlay/Chromecast readiness en MediaStream-pipeline.',
    icon: Tv,
  },
]

export const labHubIcon = FlaskConical
