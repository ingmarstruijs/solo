# Privacy Policy — SOLO Home training

**Last updated:** 2026-09-30

SOLO. / **SOLO Home training** (`net.moonbaseone.solo` on Android) is local-first software. There is no SOLO cloud account and no telemetry. The supported phone client is **Android**; iOS is not supported in this phase.

## Data we collect

**None.** The app does not send analytics, crash reports, advertising identifiers, or usage metrics to us or to third-party trackers.

## Data stored on your device

- Workouts, locker profiles, session history, settings, and preferences in browser / app local storage (and IndexedDB where used for clips)
- Optional short camera clips used only to build an on-device proof reel you export yourself

Nothing is uploaded to a SOLO backend — there is none.

## Optional network use

- **Exercise catalog search** may call the public [Wger](https://wger.de) API when you search/import exercises. That request goes to Wger, not to us.
- **Updates** (future) may check GitHub Releases for new APK versions if you enable that.

You can use core training flows offline after assets are cached.

## Bluetooth

On supported platforms, Bluetooth Low Energy may connect to a heart-rate band you choose. Heart-rate samples stay on-device for the live session / TV HUD. Pairing uses the system Bluetooth stack (or Web Bluetooth in desktop browsers).

## Camera

Camera access is used for optional form cues and optional proof-reel clips. Frames are processed on-device. Clips are not uploaded by SOLO.

## Local network (phone ↔ Android TV)

The phone and optional Android TV app exchange session state on your Wi‑Fi (discovery + WebSocket). Traffic stays on your LAN; no cloud relay.

## Children

SOLO is not directed at children and does not create child accounts.

## Contact

For privacy questions, open an issue: https://github.com/ingmarstruijs/solo/issues
