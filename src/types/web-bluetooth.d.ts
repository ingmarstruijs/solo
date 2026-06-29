/** Minimal Web Bluetooth typings for the Garmin feasibility lab. */

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  addEventListener(
    type: 'gattserverdisconnected',
    listener: (this: BluetoothDevice, ev: Event) => void,
  ): void
  removeEventListener(
    type: 'gattserverdisconnected',
    listener: (this: BluetoothDevice, ev: Event) => void,
  ): void
}

interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
}

interface BluetoothRemoteGATTService {
  readonly uuid: string
  readonly device: BluetoothDevice
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
  getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly uuid: string
  readonly service: BluetoothRemoteGATTService
  readonly properties: BluetoothCharacteristicProperties
  readValue(): Promise<DataView>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  addEventListener(
    type: 'characteristicvaluechanged',
    listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void,
  ): void
  removeEventListener(
    type: 'characteristicvaluechanged',
    listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void,
  ): void
  readonly value: DataView | null
}

interface BluetoothCharacteristicProperties {
  readonly read: boolean
  readonly write: boolean
  readonly notify: boolean
  readonly indicate: boolean
}

type BluetoothServiceUUID = number | string

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[]
  optionalServices?: BluetoothServiceUUID[]
  acceptAllDevices?: boolean
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[]
  name?: string
  namePrefix?: string
}

interface Bluetooth extends EventTarget {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
  getAvailability(): Promise<boolean>
}

interface Navigator {
  readonly bluetooth?: Bluetooth
}
