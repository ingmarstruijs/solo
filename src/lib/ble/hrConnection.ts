import {
  checkPlatform,
  explainBleError,
  getBluetoothAvailability,
  requestBleDevice,
  subscribeHeartRate,
  type HeartRateSample,
} from './probe'

export { bpmToPercentMax } from './heartRateMath'

export type HrConnectionStatus =
  | 'idle'
  | 'unsupported'
  | 'connecting'
  | 'connected'
  | 'error'

export type HrConnectionState = {
  status: HrConnectionStatus
  deviceName: string | null
  bpm: number | null
  sampleAt: number | null
  error: string | null
}

type Listener = () => void

const DEFAULT_STATE: HrConnectionState = {
  status: 'idle',
  deviceName: null,
  bpm: null,
  sampleAt: null,
  error: null,
}

let state: HrConnectionState = { ...DEFAULT_STATE }
const listeners = new Set<Listener>()

let device: BluetoothDevice | null = null
let unsubscribeHr: (() => void) | null = null
let gattserverdisconnected: (() => void) | null = null

function emit(): void {
  for (const listener of listeners) listener()
}

function setState(patch: Partial<HrConnectionState>): void {
  state = { ...state, ...patch }
  emit()
}

function clearLiveSample(): void {
  setState({ bpm: null, sampleAt: null })
}

function detachDeviceListeners(): void {
  if (device && gattserverdisconnected) {
    device.removeEventListener('gattserverdisconnected', gattserverdisconnected)
  }
  gattserverdisconnected = null
}

function resetConnection(next: Partial<HrConnectionState> = {}): void {
  unsubscribeHr?.()
  unsubscribeHr = null
  detachDeviceListeners()
  try {
    device?.gatt?.disconnect()
  } catch {
    // Device may already be gone.
  }
  device = null
  state = {
    ...DEFAULT_STATE,
    ...next,
  }
  emit()
}

export function getHrConnectionState(): HrConnectionState {
  return state
}

export function subscribeHrConnection(onChange: Listener): () => void {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function getLiveHeartRateBpm(): number | null {
  return state.status === 'connected' ? state.bpm : null
}

export function isWebBluetoothSupported(): boolean {
  const platform = checkPlatform()
  return platform.secureContext && platform.webBluetooth && !platform.inIframe
}

/**
 * Opens the browser BLE picker for a standard heart-rate monitor (0x180D)
 * and streams samples into the shared in-memory connection state.
 */
export async function connectHeartRateMonitor(): Promise<void> {
  if (!isWebBluetoothSupported()) {
    setState({
      status: 'unsupported',
      error:
        'Web Bluetooth is niet beschikbaar. Gebruik Chrome of Edge op Android/desktop (HTTPS of localhost).',
    })
    return
  }

  const availability = await getBluetoothAvailability()
  if (availability.blocking) {
    setState({ status: 'unsupported', error: availability.reason })
    return
  }

  setState({ status: 'connecting', error: null })

  try {
    const nextDevice = await requestBleDevice('hr-band')
    const server = await nextDevice.gatt?.connect()
    if (!server) throw new Error('Geen GATT-verbinding met het apparaat.')

    unsubscribeHr?.()
    detachDeviceListeners()
    device = nextDevice

    gattserverdisconnected = () => {
      resetConnection({
        status: 'idle',
        error: 'Hartslagband verbroken.',
      })
    }
    nextDevice.addEventListener('gattserverdisconnected', gattserverdisconnected)

    unsubscribeHr = await subscribeHeartRate(server, (sample: HeartRateSample) => {
      setState({
        status: 'connected',
        deviceName: nextDevice.name || 'Hartslagband',
        bpm: sample.bpm,
        sampleAt: sample.timestamp,
        error: null,
      })
    })

    setState({
      status: 'connected',
      deviceName: nextDevice.name || 'Hartslagband',
      error: null,
    })
  } catch (err) {
    resetConnection({
      status: 'error',
      error: explainBleError(err),
    })
  }
}

export function disconnectHeartRateMonitor(): void {
  resetConnection()
}

/** Clears stale error/unsupported banners without disconnecting a live link. */
export function clearHrConnectionError(): void {
  if (state.status === 'connected') {
    setState({ error: null })
    return
  }
  if (state.status === 'error' || state.status === 'unsupported') {
    clearLiveSample()
    setState({ status: 'idle', error: null })
  }
}
