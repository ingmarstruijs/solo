import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Activity,
  Bluetooth,
  BluetoothOff,
  ChevronLeft,
  Heart,
  Radio,
  ScrollText,
  TriangleAlert,
  Watch,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { BleScanMode } from '@/lib/ble/constants'
import { isHeartRateServiceUuid } from '@/lib/ble/constants'
import {
  checkPlatform,
  classifyBleDevice,
  explainBleError,
  getBluetoothAvailability,
  probeGattServices,
  readDeviceInfo,
  requestBleDevice,
  subscribeHeartRate,
  type BleDeviceKind,
  type BluetoothAvailability,
  type DeviceInfo,
  type GattServiceInfo,
  type HeartRateSample,
  type PlatformCheck,
} from '@/lib/ble/probe'

type LogEntry = {
  id: number
  time: string
  level: 'info' | 'success' | 'warn' | 'error'
  message: string
}

type ConnectionPhase = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error'

export function GarminFeasibilityPage() {
  const [platform] = useState<PlatformCheck>(() => checkPlatform())
  const [availability, setAvailability] = useState<BluetoothAvailability | null>(null)
  const [phase, setPhase] = useState<ConnectionPhase>('idle')
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [deviceKind, setDeviceKind] = useState<BleDeviceKind | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [scanMode, setScanMode] = useState<BleScanMode | null>(null)
  const [services, setServices] = useState<GattServiceInfo[]>([])
  const [heartRate, setHeartRate] = useState<HeartRateSample | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logId = useRef(0)
  const deviceRef = useRef<BluetoothDevice | null>(null)
  const hrUnsubRef = useRef<(() => void) | null>(null)

  const appendLog = useCallback((level: LogEntry['level'], message: string) => {
    const time = new Date().toLocaleTimeString('nl-NL', { hour12: false })
    setLogs((prev) => [
      { id: ++logId.current, time, level, message },
      ...prev.slice(0, 49),
    ])
  }, [])

  const disconnect = useCallback(() => {
    hrUnsubRef.current?.()
    hrUnsubRef.current = null
    deviceRef.current?.gatt?.disconnect()
    deviceRef.current = null
    setDeviceName(null)
    setDeviceId(null)
    setDeviceKind(null)
    setDeviceInfo(null)
    setScanMode(null)
    setServices([])
    setHeartRate(null)
    setPhase('idle')
    appendLog('info', 'Verbinding verbroken.')
  }, [appendLog])

  const connect = useCallback(async (mode: BleScanMode) => {
    if (!platform.webBluetooth || !platform.secureContext) return

    setScanMode(mode)
    setPhase('scanning')
    appendLog(
      'info',
      mode === 'hr-band'
        ? 'HR-band scan — filter op Heart Rate-service (0x180D).'
        : mode === 'garmin'
          ? 'Garmin-scan — filter op Garmin/HRM naam-prefixen.'
          : 'Brede BLE-scan — alle apparaten (veel unknown names).',
    )

    try {
      const device = await requestBleDevice(mode)
      deviceRef.current = device
      setDeviceId(device.id)
      setPhase('connecting')
      appendLog('success', `Geselecteerd: ${device.name ?? device.id}`)

      device.addEventListener('gattserverdisconnected', () => {
        appendLog('warn', 'GATT-server disconnected (apparaat uit bereik of uitgeschakeld).')
        hrUnsubRef.current?.()
        hrUnsubRef.current = null
        setPhase('idle')
        setHeartRate(null)
      })

      const server = device.gatt
      if (!server) throw new Error('Geen GATT-server op dit apparaat.')

      await server.connect()
      setPhase('connected')
      appendLog('success', 'GATT-verbinding actief.')

      const info = await readDeviceInfo(server, device)
      setDeviceInfo(info)
      setDeviceName(info.displayName)
      if (!device.name && info.displayName !== `Onbekend (${device.id.slice(0, 8)}…)`) {
        appendLog('info', `Naam opgehaald via Device Information: ${info.displayName}`)
      } else if (!device.name) {
        appendLog('warn', 'Apparaat adverteert geen naam — veel Garmin-banden tonen "Unknown" tot na koppeling.')
      }

      const discovered = await probeGattServices(server)
      setServices(discovered)
      const kind = classifyBleDevice(discovered, device.name ?? info.displayName, info)
      setDeviceKind(kind)
      appendLog(
        'info',
        `${discovered.length} primaire service(s) gevonden.`,
      )

      if (kind === 'hr-band') {
        appendLog('success', 'HR-band herkend via standaard Heart Rate-service (0x180D).')
      } else if (kind === 'garmin') {
        appendLog('success', 'Garmin-apparaat herkend via naam of Device Information.')
      } else if (mode === 'hr-band') {
        appendLog('warn', 'Geen Heart Rate-service gevonden op dit apparaat.')
      }

      if (discovered.length === 0) {
        appendLog(
          'warn',
          'Geen GATT-services zichtbaar. Voor Garmin reps/velocity is Connect IQ nodig; voor HR test je een band.',
        )
      }

      const hasHr = discovered.some((s) => isHeartRateServiceUuid(s.uuid))
      if (hasHr) {
        appendLog('info', 'Heart Rate-service gevonden — abonneren op metingen…')
        hrUnsubRef.current = await subscribeHeartRate(server, (sample) => {
          setHeartRate(sample)
        })
        appendLog('success', 'Live HR-stream actief.')
      } else {
        appendLog(
          'warn',
          'Geen standaard Heart Rate-service (0x180D). Rep/velocity-data vereist waarschijnlijk een Garmin Connect IQ companion.',
        )
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err)
      if (rawMessage.includes('cancelled') || rawMessage.includes('User cancelled')) {
        appendLog('info', 'Scan geannuleerd.')
        setPhase('idle')
        return
      }
      appendLog('error', explainBleError(err))
      setPhase('error')
    }
  }, [appendLog, platform.secureContext, platform.webBluetooth])

  useEffect(() => {
    return () => {
      hrUnsubRef.current?.()
      deviceRef.current?.gatt?.disconnect()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getBluetoothAvailability().then((result) => {
      if (cancelled) return
      setAvailability(result)
      if (!result.available) appendLog(result.blocking ? 'warn' : 'info', result.reason)
    })
    return () => {
      cancelled = true
    }
  }, [appendLog])

  const canConnect =
    platform.webBluetooth && platform.secureContext && availability?.blocking !== true

  return (
    <section className="flex flex-col gap-5 py-2">
      <Link
        to="/lab"
        className="flex w-fit items-center gap-1 text-sm text-muted transition-colors active:text-fg"
      >
        <ChevronLeft className="size-4" />
        Labs
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-solo-400">
            <Watch className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="label-mono text-faint">Pillar 2 · Feasibility</p>
            <h1 className="text-xl font-bold tracking-tight">Garmin Live Sync</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Twee testpaden: koppel je HR-band voor live BPM, of scan breder voor een toekomstige
              Connect IQ-bridge met reps en velocity loss.
            </p>
          </div>
        </div>
      </header>

      <PlatformPanel platform={platform} availability={availability} />

      {availability && !availability.available && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-card border p-4',
            availability.blocking ? 'border-warn/40 bg-warn/5' : 'border-line bg-surface',
          )}
        >
          <TriangleAlert
            className={cn('size-5 shrink-0', availability.blocking ? 'text-warn' : 'text-muted')}
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-sm font-semibold',
                availability.blocking ? 'text-warn' : 'text-fg',
              )}
            >
              {availability.blocking ? 'Web Bluetooth geblokkeerd' : 'Bluetooth mogelijk uit'}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{availability.reason}</p>
            {availability.status === 'no-adapter' && (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-faint">
                <li>Windows: Instellingen → Bluetooth en apparaten → zet Bluetooth aan.</li>
                <li>Desktop zonder Bluetooth? Sluit een USB BLE-dongle aan, of test op je telefoon.</li>
                <li>Je kunt alsnog op "Koppel HR-band" tikken — soms werkt scannen tóch.</li>
              </ul>
            )}
            {platform.inIframe && (
              <p className="mt-2 text-xs leading-relaxed text-faint">
                Tip: open de dev-URL (bijv. <span className="font-mono">http://localhost:5173</span>)
                rechtstreeks in een Chrome- of Edge-tabblad in plaats van de ingebedde preview.
              </p>
            )}
          </div>
        </div>
      )}

      <InfoCard title="Testpaden">
        <div className="grid gap-3">
          <TestPathCard
            title="Garmin-scan (aanbevolen)"
            description="Filtert op Garmin/HRM naam-prefixen — minder unknown devices dan de brede scan."
            recommended
          />
          <TestPathCard
            title="HR-band (alle merken)"
            description="Elke band met standaard Heart Rate-service (0x180D): Polar, Wahoo, CooSpo, Garmin HRM."
          />
          <TestPathCard
            title="Connect IQ companion (later)"
            description="Garmin-watch stuurt reps, velocity loss én HR via een eigen BLE-protocol. Nog niet gebouwd — brede scan is voor discovery."
          />
        </div>
      </InfoCard>

      <InfoCard title="Over unknown device names">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>De browser-picker toont alleen wat het apparaat in de advertentie zet — Garmin-banden sturen vaak geen naam mee.</li>
          <li>Na koppeling leest SOLO model/fabrikant uit GATT Device Information (0x180A).</li>
          <li>Gebruik <strong className="font-medium text-fg">Scan Garmin-apparaten</strong> in plaats van de brede scan om ruis te vermijden.</li>
        </ul>
      </InfoCard>

      <InfoCard title="HR-band tips">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>Maak de band nat of draag hem strak — droge sensoren geven geen signaal.</li>
          <li>Zet de band in koppelmodus (knipperend LED) en sta Bluetooth toe in Chrome op Android of desktop.</li>
          <li>Koppel de band niet tegelijk actief aan Garmin Connect — sommige banden broadcasten dan niet naar de browser.</li>
          <li>Open deze pagina in een echt browsertabblad, niet in de ingebedde IDE-preview.</li>
        </ul>
      </InfoCard>

      <div className="grid grid-cols-2 gap-3">
        <TelemetryCard
          icon={Heart}
          label="Hartslag"
          value={heartRate ? `${heartRate.bpm}` : '—'}
          unit="bpm"
          live={heartRate !== null}
        />
        <TelemetryCard
          icon={Activity}
          label="Services"
          value={services.length > 0 ? `${services.length}` : '—'}
          unit="GATT"
          live={phase === 'connected'}
        />
      </div>

      <div className="flex flex-col gap-2">
        {phase === 'connected' ? (
          <ActionButton variant="secondary" onClick={disconnect}>
            <BluetoothOff className="size-4" />
            Verbreken
          </ActionButton>
        ) : (
          <>
            <ActionButton
              variant="primary"
              onClick={() => void connect('garmin')}
              disabled={!canConnect || phase === 'scanning' || phase === 'connecting'}
            >
              <Watch className="size-4" />
              {phase === 'scanning' && scanMode === 'garmin'
                ? 'Kies Garmin…'
                : phase === 'connecting' && scanMode === 'garmin'
                  ? 'Verbinden…'
                  : 'Scan Garmin-apparaten'}
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => void connect('hr-band')}
              disabled={!canConnect || phase === 'scanning' || phase === 'connecting'}
            >
              <Heart className="size-4" />
              {phase === 'scanning' && scanMode === 'hr-band'
                ? 'Kies HR-band…'
                : phase === 'connecting' && scanMode === 'hr-band'
                  ? 'Verbinden…'
                  : 'Alle HR-banden (0x180D)'}
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => void connect('any')}
              disabled={!canConnect || phase === 'scanning' || phase === 'connecting'}
            >
              <Bluetooth className="size-4" />
              {phase === 'scanning' && scanMode === 'any'
                ? 'Kies apparaat…'
                : phase === 'connecting' && scanMode === 'any'
                  ? 'Verbinden…'
                  : 'Brede scan (alle BLE)'}
            </ActionButton>
          </>
        )}
      </div>

      {deviceName && (
        <InfoCard title="Apparaat">
          <dl className="grid gap-1 text-sm">
            <Row label="Naam" value={deviceName} />
            {deviceInfo?.manufacturer && <Row label="Fabrikant" value={deviceInfo.manufacturer} />}
            {deviceInfo?.model && <Row label="Model" value={deviceInfo.model} mono />}
            <Row label="Type" value={deviceKindLabel(deviceKind)} />
            <Row label="Scanmodus" value={scanModeLabel(scanMode)} />
            <Row label="ID" value={deviceId ?? '—'} mono />
            <Row label="Status" value={phaseLabel(phase)} />
          </dl>
        </InfoCard>
      )}

      {services.length > 0 && (
        <InfoCard title="GATT Discovery" icon={Radio}>
          <ul className="flex flex-col gap-2">
            {services.map((service) => (
              <li
                key={service.uuid}
                className="rounded-lg border border-line bg-surface-2/60 px-3 py-2"
              >
                <p className="font-mono text-xs text-solo-300">{service.uuid}</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {service.characteristics.map((char) => (
                    <li key={char.uuid} className="font-mono text-[11px] text-muted">
                      {char.uuid}
                      {char.properties.length > 0 && (
                        <span className="text-faint"> · {char.properties.join(', ')}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </InfoCard>
      )}

      <InfoCard title="Hypothese & beperkingen">
        <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted">
          <li>
            <strong className="font-medium text-fg">HR-band</strong> is het snelste pad om vandaag te
            testen: standaard GATT Heart Rate (0x180D) werkt direct via Web Bluetooth.
          </li>
          <li>
            <strong className="font-medium text-fg">Garmin-watch</strong> levert waarschijnlijk geen
            reps/velocity via standaard BLE — daarvoor is een Connect IQ companion nodig.
          </li>
          <li>
            <strong className="font-medium text-fg">Connect IQ companion</strong> wordt de bron voor
            set-start, rep-teller en velocity loss; de HR-band kan intussen dezelfde BPM-pipeline
            valideren.
          </li>
          <li>
            Chrome op Android of desktop vereist HTTPS/localhost; Safari op iOS ondersteunt geen Web
            Bluetooth.
          </li>
        </ul>
      </InfoCard>

      <InfoCard title="Event log" icon={ScrollText}>
        {logs.length === 0 ? (
          <p className="text-sm text-faint">Nog geen events — start een scan om te testen.</p>
        ) : (
          <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
            {logs.map((entry) => (
              <li
                key={entry.id}
                className="font-mono text-[11px] leading-relaxed"
              >
                <span className="text-faint">{entry.time}</span>{' '}
                <span className={logColor(entry.level)}>[{entry.level}]</span>{' '}
                <span className="text-muted">{entry.message}</span>
              </li>
            ))}
          </ul>
        )}
      </InfoCard>
    </section>
  )
}

function PlatformPanel({
  platform,
  availability,
}: {
  platform: PlatformCheck
  availability: BluetoothAvailability | null
}) {
  const checks = [
    {
      label: 'Secure context (HTTPS)',
      ok: platform.secureContext,
      hint: platform.secureContext ? 'OK' : 'Vereist voor BLE',
    },
    {
      label: 'Web Bluetooth API',
      ok: platform.webBluetooth,
      hint: platform.webBluetooth ? 'Beschikbaar' : 'Niet ondersteund',
    },
    {
      label: 'Standalone context',
      ok: !platform.inIframe,
      hint: platform.inIframe ? 'In iframe/preview' : 'Eigen tabblad',
    },
    {
      label: 'Adapter beschikbaar',
      ok: availability?.available ?? false,
      hint: availability ? (availability.available ? 'Ja' : 'Geblokkeerd') : 'Controleren…',
    },
  ]

  const allOk = checks.every((c) => c.ok)

  return (
    <div
      className={cn(
        'rounded-card border p-4',
        allOk ? 'border-success/30 bg-success/5' : 'border-warn/30 bg-warn/5',
      )}
    >
      <p className="mb-3 text-sm font-semibold">
        {allOk ? 'Platform klaar voor BLE-test' : 'Platform niet geschikt'}
      </p>
      <ul className="flex flex-col gap-2">
        {checks.map(({ label, ok, hint }) => (
          <li key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted">{label}</span>
            <span className={cn('font-mono text-xs', ok ? 'text-success' : 'text-warn')}>
              {hint}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TelemetryCard({
  icon: Icon,
  label,
  value,
  unit,
  live,
}: {
  icon: typeof Heart
  label: string
  value: string
  unit: string
  live: boolean
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-solo-400" />
        {live && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            <span className="label-mono text-[10px] text-success">LIVE</span>
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-xs text-muted">
        {label} · {unit}
      </p>
    </div>
  )
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: typeof Radio
  children: ReactNode
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-solo-400" />}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn('truncate text-right', mono && 'font-mono text-xs text-faint')}>
        {value}
      </dd>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  variant: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
        variant === 'primary' &&
          'bg-solo-400 text-ink active:bg-solo-500 disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'secondary' &&
          'border border-line bg-surface-2 text-fg active:bg-surface-3 disabled:opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function phaseLabel(phase: ConnectionPhase): string {
  switch (phase) {
    case 'connected':
      return 'Verbonden'
    case 'connecting':
      return 'Verbinden…'
    case 'scanning':
      return 'Scannen…'
    case 'error':
      return 'Fout'
    default:
      return 'Idle'
  }
}

function logColor(level: LogEntry['level']): string {
  switch (level) {
    case 'success':
      return 'text-success'
    case 'warn':
      return 'text-warn'
    case 'error':
      return 'text-danger'
    default:
      return 'text-faint'
  }
}

function TestPathCard({
  title,
  description,
  recommended,
}: {
  title: string
  description: string
  recommended?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-3',
        recommended ? 'border-solo-400/40 bg-solo-400/5' : 'border-line bg-surface-2/60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {recommended && <span className="label-mono text-[10px] text-solo-300">Aanbevolen</span>}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  )
}

function deviceKindLabel(kind: BleDeviceKind | null): string {
  switch (kind) {
    case 'garmin':
      return 'Garmin'
    case 'hr-band':
      return 'HR-band (0x180D)'
    case 'unknown':
      return 'Onbekend / overig BLE'
    default:
      return '—'
  }
}

function scanModeLabel(mode: BleScanMode | null): string {
  switch (mode) {
    case 'garmin':
      return 'Garmin prefix-filter'
    case 'hr-band':
      return 'Heart Rate-service'
    case 'any':
      return 'Alle apparaten'
    default:
      return '—'
  }
}
