/** Standard BLE GATT service and characteristic UUIDs used in the feasibility probe. */

export const BLE = {
  heartRate: {
    service: 'heart_rate' as const,
    measurement: 'heart_rate_measurement' as const,
  },
  battery: {
    service: 'battery_service' as const,
    level: 'battery_level' as const,
  },
  deviceInfo: {
    service: 'device_information' as const,
    manufacturer: 'manufacturer_name_string' as const,
    model: 'model_number_string' as const,
    serial: 'serial_number_string' as const,
  },
} as const

/** Name prefixes commonly used in Garmin BLE advertisements. */
export const GARMIN_NAME_PREFIXES = [
  'Garmin',
  'GARMIN',
  'HRM-',
  'HRM_',
  'Fenix',
  'Forerunner',
  'Instinct',
  'vivosmart',
  'vivofit',
  'Venu',
  'epix',
  'Edge',
  'MARQ',
] as const

/** How the BLE picker should filter devices. */
export type BleScanMode = 'hr-band' | 'garmin' | 'any'

/** Services we request access to when scanning — Garmin may expose none of these. */
export const OPTIONAL_SERVICES: string[] = [
  BLE.heartRate.service,
  BLE.battery.service,
  BLE.deviceInfo.service,
  'fitness_machine',
  'cycling_power',
  'running_speed_and_cadence',
]

export function isHeartRateServiceUuid(uuid: string): boolean {
  return uuid === BLE.heartRate.service || uuid === '0x180D' || uuid.toLowerCase() === '0000180d-0000-1000-8000-00805f9b34fb'
}
