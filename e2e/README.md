# Pair smoke E2E (local)

CI gate for pairing is the **JVM real WebSocket smoke** in `:transport`
(`RealWebSocketPairingSmokeTest`) — OkHttp phone ↔ Java-WebSocket TV on loopback.

Dual **Android emulator + Maestro** flows live here for local device smoke until
GitHub Actions has phone + TV AVDs.

## Prerequisites

- Phone emulator (or device) with `net.moonbaseone.solo.debug`
- Android TV emulator (or device) with `net.moonbaseone.solo.tv.debug`
- Both on the same network / emulator host mapping so the phone can reach the TV LAN IP
- [Maestro](https://maestro.mobile.dev/) CLI

```bash
cd apps
./gradlew :android:assembleFossDebug :android-tv:assembleFossDebug
adb -s <phone> install -r android/build/outputs/apk/foss/debug/*.apk
adb -s <tv> install -r android-tv/build/outputs/apk/foss/debug/*.apk
```

## Flows

| Flow | What it checks |
| --- | --- |
| [`pair-smoke.yaml`](pair-smoke.yaml) | Phone shell opens; pair fields + Connect visible (manual host/code still needed across two devices) |

Cross-device host/code injection is still manual: read the TV pair code / host from the TV UI (`tv_pair_code`, `tv_host_port`), then enter them on the phone. Automating that across two Maestro sessions lands with emulator CI later.
