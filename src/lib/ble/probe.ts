import {
  BLE,
  GARMIN_NAME_PREFIXES,
  isHeartRateServiceUuid,
  OPTIONAL_SERVICES,
  type BleScanMode,
} from './constants'

export type PlatformCheck = {
  secureContext: boolean
  webBluetooth: boolean
  inIframe: boolean
  userAgent: string
}

export type BluetoothAvailability = {
  available: boolean
  /** Hard block (no API / iframe) versus soft warning (adapter reported off). */
  blocking: boolean
  status: 'ok' | 'unsupported' | 'iframe' | 'no-adapter' | 'error'
  reason: string
}

export type GattCharacteristicInfo = {
  uuid: string
  properties: string[]
}

export type GattServiceInfo = {
  uuid: string
  characteristics: GattCharacteristicInfo[]
}

export type HeartRateSample = {
  bpm: number
  timestamp: number
}

function detectIframe(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.self !== window.top
  } catch {
    // Cross-origin access throws — that itself means we are framed.
    return true
  }
}

export function checkPlatform(): PlatformCheck {
  return {
    secureContext: typeof window !== 'undefined' && window.isSecureContext,
    webBluetooth: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    inIframe: detectIframe(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }
}

/**
 * Probes whether the Web Bluetooth adapter is actually usable. The API object
 * can exist while still being blocked by a permissions policy (e.g. embedded
 * previews) or a disabled OS/browser adapter.
 */
export async function getBluetoothAvailability(): Promise<BluetoothAvailability> {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    return {
      available: false,
      blocking: true,
      status: 'unsupported',
      reason: 'Web Bluetooth API niet aanwezig in deze browser. Gebruik Chrome of Edge.',
    }
  }

  if (detectIframe()) {
    return {
      available: false,
      blocking: true,
      status: 'iframe',
      reason:
        'Pagina draait in een iframe/preview zonder bluetooth-permissie. Open de app in een echt browsertabblad.',
    }
  }

  try {
    const available = await navigator.bluetooth.getAvailability()
    return available
      ? { available: true, blocking: false, status: 'ok', reason: 'Bluetooth-adapter beschikbaar.' }
      : {
          available: false,
          blocking: false,
          status: 'no-adapter',
          reason:
            'Bluetooth lijkt uitgeschakeld of er is geen adapter. Zet Bluetooth aan in Windows (of sluit een dongle aan) en probeer toch te scannen — deze melding kan onterecht zijn.',
        }
  } catch (err) {
    return { available: false, blocking: false, status: 'error', reason: explainBleError(err) }
  }
}

/** Maps raw Chromium Web Bluetooth errors to actionable Dutch guidance. */
export function explainBleError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err)

  if (message.includes('globally disabled')) {
    return 'Web Bluetooth is geblokkeerd in deze context — meestal de ingebedde preview/iframe of een uitgeschakelde browservlag. Open de app in een echt Chrome/Edge-tabblad (chrome://flags → Web Bluetooth aan).'
  }
  if (message.includes('User cancelled') || message.includes('cancelled')) {
    return 'Scan geannuleerd door gebruiker.'
  }
  if (message.includes('permissions policy') || message.includes('Permissions Policy')) {
    return 'Permissions Policy blokkeert bluetooth. Voeg allow="bluetooth" toe aan de iframe, of open de app standalone.'
  }
  if (message.includes('secure context') || message.includes('Secure context')) {
    return 'Web Bluetooth vereist HTTPS of localhost.'
  }
  return message
}

export function formatGattUuid(uuid: string): string {
  if (uuid.length === 4) return `0x${uuid.toUpperCase()}`
  return uuid
}

function characteristicProps(char: BluetoothRemoteGATTCharacteristic): string[] {
  const props: string[] = []
  if (char.properties.read) props.push('read')
  if (char.properties.write) props.push('write')
  if (char.properties.notify) props.push('notify')
  if (char.properties.indicate) props.push('indicate')
  return props
}

export type BleDeviceKind = 'hr-band' | 'garmin' | 'unknown'

export type DeviceInfo = {
  manufacturer?: string
  model?: string
  serial?: string
  displayName: string
}

function decodeGattString(data: DataView): string {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  return new TextDecoder().decode(bytes).replace(/\0/g, '').trim()
}

async function readGattString(
  service: BluetoothRemoteGATTService,
  characteristicUuid: string,
): Promise<string | undefined> {
  try {
    const characteristic = await service.getCharacteristic(characteristicUuid)
    if (!characteristic.properties.read) return undefined
    const value = await characteristic.readValue()
    const text = decodeGattString(value)
    return text || undefined
  } catch {
    return undefined
  }
}

export function looksLikeGarminName(name: string | undefined): boolean {
  if (!name) return false
  const lower = name.toLowerCase()
  return (
    GARMIN_NAME_PREFIXES.some((prefix) => lower.includes(prefix.toLowerCase())) ||
    lower.includes('hrm')
  )
}

export function buildDeviceDisplayName(
  device: BluetoothDevice,
  info: Partial<Pick<DeviceInfo, 'manufacturer' | 'model'>>,
): string {
  if (device.name) return device.name
  if (info.model && info.manufacturer) return `${info.manufacturer} ${info.model}`
  if (info.model) return info.model
  if (info.manufacturer) return info.manufacturer
  return `Onbekend (${device.id.slice(0, 8)}…)`
}

export async function readDeviceInfo(
  server: BluetoothRemoteGATTServer,
  device: BluetoothDevice,
): Promise<DeviceInfo> {
  const info: DeviceInfo = { displayName: buildDeviceDisplayName(device, {}) }

  try {
    const service = await server.getPrimaryService(BLE.deviceInfo.service)
    const [manufacturer, model, serial] = await Promise.all([
      readGattString(service, BLE.deviceInfo.manufacturer),
      readGattString(service, BLE.deviceInfo.model),
      readGattString(service, BLE.deviceInfo.serial),
    ])

    info.manufacturer = manufacturer
    info.model = model
    info.serial = serial
    info.displayName = buildDeviceDisplayName(device, info)
  } catch {
    // Device Information service is optional.
  }

  return info
}

function garminScanFilters(): BluetoothLEScanFilter[] {
  // Chromium caps filter count; keep the highest-signal Garmin prefixes.
  const prefixes = GARMIN_NAME_PREFIXES.slice(0, 10)
  return [
    ...prefixes.map((namePrefix) => ({ namePrefix })),
    { services: [BLE.heartRate.service], namePrefix: 'HRM' },
  ]
}

export async function requestBleDevice(mode: BleScanMode = 'any'): Promise<BluetoothDevice> {
  if (!navigator.bluetooth) {
    throw new Error('Web Bluetooth is niet beschikbaar in deze browser.')
  }

  if (mode === 'hr-band') {
    return navigator.bluetooth.requestDevice({
      filters: [{ services: [BLE.heartRate.service] }],
      optionalServices: [BLE.battery.service, BLE.deviceInfo.service],
    })
  }

  if (mode === 'garmin') {
    return navigator.bluetooth.requestDevice({
      filters: garminScanFilters(),
      optionalServices: OPTIONAL_SERVICES,
    })
  }

  return navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: OPTIONAL_SERVICES,
  })
}

export function classifyBleDevice(
  services: GattServiceInfo[],
  name?: string,
  info?: DeviceInfo,
): BleDeviceKind {
  if (info?.manufacturer?.toLowerCase().includes('garmin')) return 'garmin'
  if (looksLikeGarminName(name) || looksLikeGarminName(info?.model)) return 'garmin'
  if (services.some((service) => isHeartRateServiceUuid(service.uuid))) return 'hr-band'
  return 'unknown'
}

export async function probeGattServices(server: BluetoothRemoteGATTServer): Promise<GattServiceInfo[]> {
  const services = await server.getPrimaryServices()
  const result: GattServiceInfo[] = []

  for (const service of services) {
    const characteristics = await service.getCharacteristics()
    result.push({
      uuid: formatGattUuid(service.uuid),
      characteristics: characteristics.map((char) => ({
        uuid: formatGattUuid(char.uuid),
        properties: characteristicProps(char),
      })),
    })
  }

  return result
}

/** Parse the standard BLE Heart Rate Measurement characteristic (0x2A37). */
export function parseHeartRateMeasurement(data: DataView): number {
  const flags = data.getUint8(0)
  const isUint16 = (flags & 0x01) !== 0
  return isUint16 ? data.getUint16(1, true) : data.getUint8(1)
}

export async function subscribeHeartRate(
  server: BluetoothRemoteGATTServer,
  onSample: (sample: HeartRateSample) => void,
): Promise<() => void> {
  const service = await server.getPrimaryService(BLE.heartRate.service)
  const characteristic = await service.getCharacteristic(BLE.heartRate.measurement)

  const handler = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    if (!target.value) return
    onSample({
      bpm: parseHeartRateMeasurement(target.value),
      timestamp: Date.now(),
    })
  }

  characteristic.addEventListener('characteristicvaluechanged', handler)
  await characteristic.startNotifications()

  return () => {
    characteristic.removeEventListener('characteristicvaluechanged', handler)
    void characteristic.stopNotifications()
  }
}
