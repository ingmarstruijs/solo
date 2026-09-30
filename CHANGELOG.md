# Changelog

All notable changes to SOLO. are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The `### Store` subsection under each release is the source for Fastlane /
F-Droid store notes. Run `./tool/sync_fastlane_changelogs.sh` after editing it.

## [Unreleased]

### Added

- Release / F-Droid scaffolding (CHANGELOG, Fastlane stubs, metadata drafts, AGENTS.md) modeled on Kinetic.
- Android stack research: Kotlin + Compose phone + Android TV, iOS dropped, **Byte-RB required** for F-Droid `foss`, native BLE ([docs/native-android-stack.md](docs/native-android-stack.md)). Capacitor not chosen.
- Store / display name: **SOLO Home training** (brand mark remains SOLO.).

## [0.1.0] - 2026-09-30

### Store

Privacy-first home training: locker-aware prep, live session + optional Android TV board, BLE HR, form cues, on-device logbook.

### Added

- React 19 / Vite PWA with offline shell
- Workouts, home locker, prep, live session, logbook
- TV receiver (`/tv`) via BroadcastChannel
- Coach voice, themes, i18n (EN/NL/DE/FR)
- Labs for Garmin BLE, pose, canvas composite, cast stream
