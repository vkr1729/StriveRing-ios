# StriveRing Simulator UAT

## Purpose

Validate the complete daily time rhythm, active timer resilience, focus lock-in gate, workout turnaround, and drift audit on an iPhone 17 simulator running the latest iOS 26 runtime (CI falls back to the newest available iPhone simulator if the image lacks one).

Device note: the shipped `.ipa` targets sideloading via **SideStore / LiveContainer on iPhone 16**. LiveContainer suspends background apps aggressively, so timer journeys below explicitly cover backgrounding, relaunch persistence, and runaway-session trim.

## Automated acceptance (unit + UI)

Unit tests (`Tests/StriveRingTests`) cover the scoring engine directly:

| Case | Expectation |
| :--- | :--- |
| 4.0h Focus on weekday | 20 pts, gate open, 2.0h remaining |
| Exactly 6.0h Focus | 30 pts, `★ 6.0h Gate Locked In` |
| 8.0h / 12.0h Focus | Capped at 40 pts |
| 40m Workout | +20 pts, weekly count +1 |
| 20m Workout | Partial credit, not complete |
| 7.5h Sleep | 25 pts; 5h deficit penalized |
| Overnight sleep (Tue 11pm → Wed 7am) | Attributed to Wednesday (wake day), not Tuesday |
| 25m Drift | 0 penalty (grace buffer) |
| 45m / 80m / 120m Drift | −5 / −10 / −20 pts |
| Weekend (4h family, 8h sleep, 40m workout) | 80 pts, gate auto-satisfied |
| Perfect weekday | Exactly 100 (clamped) |
| Unlogged historical day | `isUnloggedGapHigh` flagged |
| `SessionManager` tick/pause/resume/stop | True start preserved across pause/resume; orphaned session returned, never discarded |

Simulator UI journeys (`Tests/StriveRingUITests`):

1. **Launch & tab navigation** — `Today’s Rhythm` + `ALIGNMENT` render; Timeline shows `24h Timeline`; Trends shows `Accountability` and the workout target card.
2. **Active session start** — Focus quick-start opens the chamber or the `ACTIVE SESSION` dock.
3. **Retroactive logging + undo** — Focus quick-add opens `Log Time Block`, Confirm writes the session, `Undo` toast appears.
4. **Workout full credit** — 40m workout logs and the pillar card shows `Weekly: Day 1 of 6` with `+20 pts`.
5. **Calibration** — Trends → Calibration renders the gate, workout, family, weekend, and drift rule cards.

## Manual UAT checklist (iPhone 16 via LiveContainer)

Run these once per release on-device; each takes seconds.

- [ ] **Fresh install shows empty state** — Today ring at 0, Timeline shows “No Sessions Logged Yet”, no crashes.
- [ ] **Live session survives backgrounding** — start Focus, lock phone 60s, reopen: elapsed matches wall clock (no reset, no jump).
- [ ] **Live session survives LiveContainer relaunch** — start Workout, force-close, reopen: timer resumes from `UserDefaults` state.
- [ ] **Runaway prompt** — a 4h+ non-sleep session offers Keep / Trim 3h / Trim 4h / Cancel; each persists correctly.
- [ ] **Gate copy is honest** — with 5h already logged, Focus Chamber shows ~1.0h remaining, not 6.0h.
- [ ] **Quick-log defaults match category** — Workout opens at 40m, Sleep at 7h30m, Focus at 1h30m.
- [ ] **Undo works on both tabs** — Today toast restores the logged entry; Timeline delete toast restores the deleted entry.
- [ ] **Feel check** — tab switches, ring animation, and timer tick all feel instant (1s tick, spring ring, no hitches on iPhone 16).

## Release gate

- All unit tests and all simulator UI journeys pass on the latest iOS 26 simulator runtime.
- Zero crash, zero timer drift, zero lost sessions, zero visual truncation.
- A fresh, sideloadable `StriveRing-unsigned-ipa` is generated and uploaded as a GitHub Actions artifact (built on every push to `main`, every PR touching app code, and on demand via workflow dispatch).
