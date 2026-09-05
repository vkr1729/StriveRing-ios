# StriveRing

## Outcome

StriveRing is a private, native iOS 26 application for Kedar. It turns the reality of the 24-hour day (1,440 minutes) into an honest **Daily Alignment Score (0–100)** and a **Clear Glass Segmented Rhythm Ring**. 

It is designed for unyielding personal accountability: locking in 8 hours of focused work with a mandatory 6-hour minimum gate, reviving a 5–6x weekly workout habit with full credit for 40-minute sessions, safeguarding uninterrupted evening presence with his growing son, and catching mindless social media drift before it consumes the day.

## Scope

- **Current module**: Full native Swift/SwiftUI redesign using the Clear Glass design language, replacing the legacy React Native/Expo codebase. Includes:
  - 4 core pillars (Focus Work, Workout, Sleep, Family/Kid) + Active Drift tracking + Routine Upkeep recognition.
  - Active Floating Stopwatch Dock with zero timer drift across backgrounding.
  - Quick-log half sheet for retroactive entries (+30m, +1h, custom wheel).
  - 24-Hour chronological Timeline stream.
  - Weekly Accountability Trends (5–6x workout consistency counter, weekday focus gate compliance, drift audit).
  - XcodeGen project generator (`project.yml`) and GitHub Actions CI workflow producing an unsigned `.ipa` for SideStore/LiveContainer.
  - Simulator UAT suite validating all core journeys on iPhone 17 (iOS 26.5).
- **Not included**: Public App Store distribution, HealthKit syncing, cloud databases, user accounts, social feeds, or battery-draining Live Activities / Home Screen widgets.

## Architecture and why

StriveRing is built as a direct architectural twin to **Span** ([Health_Span](file:///home/kedarnath-reddy-vallaboina/Health_Span)):
- **100% Native SwiftUI & SwiftData**: Zero JavaScript runtime, zero npm dependencies, instant 120Hz micro-interactions, and native iOS 26 frosted glass materials (`.ultraThinMaterial`).
- **XcodeGen (`project.yml`)**: The entire Xcode project is declared in a single 60-line YAML file. Generated `.xcodeproj` bundles are never committed to Git.
- **Why this fits**: The previous React Native/Expo architecture was bloated with hundreds of npm packages, custom native plugins for widgets, and brittle build scripts. Stripping this down to ~5 clean Swift files makes the codebase lightning-fast, offline-first, and completely maintainable.

### Scoring Formula

```text
Daily Alignment Score = Focus Pts (max 40) 
                      + Workout Pts (max 20) 
                      + Sleep Pts (max 25) 
                      + Family Pts (max 15) 
                      - Drift Penalties (max -20)
                      [Clamped to 0–100]
```

* **Focus Work (40 pts max)**:
  * Weekdays: Hard minimum gate of **6.0 hours** to unlock primary credit (+30 pts). Hours 6–8 earn +5 pts/hr up to 40 pts. If <6.0h on a weekday, flagged as an unfulfilled gate.
  * Weekends (Sat/Sun): Dynamic shift — focus becomes optional (0h target, bonus only).
* **Workout (20 pts max)**:
  * Target: 5–6 sessions / week.
  * Threshold: Any focused session **≥ 35–40 minutes** awards full **+20 points** and advances weekly count (`Day X of 6`).
* **Sleep (25 pts max)**:
  * 7.5–8.5h = **+25 pts**; 6.0–7.0h = **+15 pts**; <6.0h = **+5 pts**.
* **Family / Kid Time (15 pts max)**:
  * 1.5–2.5h of dedicated evening presence = 7.5 pts/hr up to **+15 pts**.
  * Weekends: Expands to 4.0h target (35 pts) to lead the weekend alignment score.
* **Daily Routine Upkeep (~3.5–4.5h)**:
  * Bath, lunch, dinner, morning routine, and transit are expected and neutral.
  * If unlogged waking gap exceeds **> 5.0 hours**, a non-judgmental logging reminder triggers.
* **Drift / Social Media Leak**:
  * 0 to 30 mins / day = **Free Grace Buffer (0 penalty)**.
  * 31 to 60 mins = **-5 pts**; 61 to 90 mins = **-10 pts**; >90 mins = **-20 pts max cap**.

## How it works

1. **Input**: Time is logged either actively via the **Floating Stopwatch Dock** (Start / Pause / Finish) or retroactively via the **Quick Log Sheet** (+30m, +1h chips).
2. **State Processing**: `SessionManager` tracks live timers using immutable `startTime: Date`. On app relaunch, elapsed time is computed as `Date.now.timeIntervalSince(startTime) + accumulatedSeconds`, preventing timer drift.
3. **Scoring Engine**: `AlignmentEngine` evaluates logged sessions against the day's weekday/weekend profile, applies gates, consistency bonuses, and drift penalties.
4. **Storage**: SwiftData persists `TimeSession` and `TimeCategory` locally on-device.
5. **Output**: Renders the 4-track Clear Glass Segmented Rhythm Ring, large tabular score (`84`), and 24-hour timeline stream.

## File map

| Path | What it contains | Why it exists / connects to |
| :--- | :--- | :--- |
| `project.yml` | XcodeGen specification | Generates `StriveRing.xcodeproj` targeting iOS 26+ |
| `Sources/StriveRing/StriveRingApp.swift` | App entry point & TabView | Configures SwiftData `ModelContainer` and root tabs |
| `Sources/StriveRing/Domain.swift` | SwiftData models & Scoring Engine | Defines `TimeSession`, `TimeCategory`, and `AlignmentEngine` |
| `Sources/StriveRing/TodayView.swift` | Main dashboard & Rhythm Ring | Displays the 4-track Clear Glass ring, active dock, and cards |
| `Sources/StriveRing/FocusChamberView.swift` | Deep work focus view | Distraction-free full-screen glass timer for active sprints |
| `Sources/StriveRing/TimelineView.swift` | 24-hour chronological stream | Maps the day's hours and highlights unlogged drift |
| `Sources/StriveRing/TrendsView.swift` | Weekly accountability | Tracks 5–6x workout streak, focus gate compliance, and drift audit |
| `Sources/StriveRing/Components.swift` | Reusable Clear Glass UI tokens | Shared buttons, ring curves, undo toast, and color palette |
| `Tests/StriveRingTests/StriveRingTests.swift` | Unit tests | Validates scoring math, 6h gate, 40m workout, drift buffer, timer math |
| `Tests/StriveRingUITests/StriveRingUITests.swift` | Automated Simulator UAT | Tests full end-to-end user journeys on iPhone 17 (iOS 26.5) |
| `.github/workflows/build-ios.yml` | GitHub Actions CI/CD | Runs unit & UAT tests, builds unsigned `.ipa` artifact |

## Implementation

1. **Purge & Scaffold**: Remove legacy React Native/Expo dependencies, set up `project.yml`, and initialize the pure Swift project structure.
2. **Domain & Engine**: Implement SwiftData models (`TimeSession`, `TimeCategory`) and the `AlignmentEngine` (scoring curves, 6h gate, 40m workout threshold, 30m drift buffer, weekend shift).
3. **UI & Clear Glass Views**: Build `TodayView` with the Segmented Rhythm Ring, `FocusChamberView`, `TimelineView`, `TrendsView`, and active timer dock.
4. **Unit Tests & Simulator UAT**: Build and verify automated tests and simulator UAT on iPhone 17.
5. **CI/CD Workflow & IPA Delivery**: Run the GitHub Actions workflow to produce the verified `StriveRing-unsigned-ipa`.

## Proof checks

1. **Primary Journey**: Start a 40m Workout session, complete it, verify it writes to SwiftData, awards +20 pts, and increments weekly consistency counter (`Day X of 6`).
2. **Boundary Gate Check**: Log 4.0h Focus Work on a weekday (verify score is 20 and gate warns unfulfilled); log past 6.0h (verify `★ 6.0h Gate Achieved` milestone unlocks +30 pts); log past 8.0h (verify 40 pts cap).
3. **Drift Buffer Check**: Log 25m YouTube (verify 0 penalty); log 45m YouTube (verify -5 pts penalty); verify 24h timeline highlights unlogged gaps > 5.0h.

## Run and limitations

* **Generate Xcode Project**: `xcodegen generate`
* **Build Target**: iOS 26+, iPhone-only.
* **Sideloading**: Push changes to GitHub, trigger the `Build StriveRing iOS` workflow via `gh workflow run build-ios.yml`, and download the unsigned `.ipa` artifact for SideStore/LiveContainer.
* **Limitations**: Single-user, offline-only. No cross-device cloud synchronization.
