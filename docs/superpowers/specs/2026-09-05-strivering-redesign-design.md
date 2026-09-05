# StriveRing: Native iOS 26 Redesign Specification

**Date:** 2026-09-05  
**Author:** Pair Programming Agent & Kedar  
**Status:** Validated Design / Ready for Implementation Planning  
**Target:** iOS 26+, iPhone-only, Native SwiftUI & SwiftData  
**Design Reference:** Direction D (Clear Glass Signature)  

---

## 1. Executive Summary & Goals

StriveRing is being completely overhauled from a hybrid React Native/Expo app with complicated ActivityKit/Widget extensions into a **pure native SwiftUI & SwiftData iOS 26 application**. 

StriveRing is the direct architectural and aesthetic sister app to **Span** ([Health_Span](file:///home/kedarnath-reddy-vallaboina/Health_Span)):
* **Aesthetic**: Shares the exact **Clear Glass** design language (frosted translucent cards, canvas `#F2F5F8`, dark forest brand accents, monospaced digits, and SF Pro typography).
* **Architecture**: 100% native Swift, SwiftData persistence, generated via `XcodeGen` ([project.yml](file:///home/kedarnath-reddy-vallaboina/StriveRing-ios/project.yml)), and compiled on GitHub Actions into an unsigned `.ipa` for **SideStore / LiveContainer** sideloading in ~90 seconds.
* **Core Purpose**: An unyielding, calm 24-hour time-allocation instrument that holds you accountable to your personal priorities: locking in 8 hours of deep focus, reviving 5–6 weekly workouts, guaranteeing uninterrupted evening presence with your growing kid, and exposing mindless social media drift.

---

## 2. Personal Pillars & Calibrated Scoring Engine

Every day consists of exactly 1,440 minutes. The **Daily Alignment Score (0–100 pts)** reflects intentional time distribution, with heavy weight given to the areas requiring the most discipline:

| Pillar | Daily Target | Max Pts | Weight & Behavior Rules |
| :--- | :---: | :---: | :--- |
| **Focus Work** | **8.0 hours** | **40 pts** | **The Hard Gate:** Requires locking in at least **6.0 hours** to earn primary credit (+30 pts). Hours 6.0 to 8.0 earn +5 pts/hr up to 40 pts. If < 6.0h on a weekday, an alert warns of an unfulfilled gate. Capped at 8.5h to prevent burnout and protect family time. |
| **Workout** | **5–6x / week** | **20 pts** | **The Turnaround Nudge:** Rebounding from 2/wk to 5–6/wk (45–60 mins/session). Logging a completed workout immediately locks in the full **+20 points** for the day. Tracks weekly consistency (`Day X of 6`). |
| **Sleep** | **7.5–8.5 hours** | **25 pts** | **The Foundation:** 7.5–8.5h earns the full +25 pts. 6.0–7.0h earns +15 pts. < 6.0h drops to +5 pts. |
| **Family & Kid Time** | **1.5–2.5 hours** | **15 pts** | **The Sacred Evening Window:** Dedicated screen-free presence with kid (playtime, dinner, bedtime). Earns 7.5 pts/hr up to 15 pts. |
| **Drift / Distraction** | **0 mins** | **-5 pts / 30m** | **The Leak Audit:** Active tracking for YouTube, Instagram, and mindless browsing. Each 30 minutes deducts -5 points from daily alignment. Unallocated waking hours are exposed as open drift. |
| **Total Daily** | **1,440 mins** | **100 pts** | **A 90+ score represents an extraordinary day of execution and presence.** |

---

## 3. System Architecture & Tech Stack

```
┌───────────────────────────────────────────────────────────┐
│              StriveRing Native SwiftUI (iOS 26)           │
├─────────────────────────────┬─────────────────────────────┤
│ Today Tab (Ring Hero)       │ Timeline Tab (24h stream)   │
│ Focus Chamber (Live Timer)  │ Trends & Accountability Tab │
├─────────────────────────────┴─────────────────────────────┤
│                    SessionManager                         │
│  - Active Stopwatch State   - Elapsed Time Calculation    │
│  - Conflict Resolution      - Background Persistence      │
├───────────────────────────────────────────────────────────┤
│                   DailyAlignmentEngine                    │
│  - 8h Focus Gate Math       - 5-6x Workout Multiplier     │
│  - Drift Penalty Formula    - 100-pt Score Aggregation    │
├───────────────────────────────────────────────────────────┤
│                    SwiftData Local Store                  │
│       TimeSession (UUID)    │    TimeCategory (Enum/Class)│
└───────────────────────────────────────────────────────────┘
```

### Key Technical Decisions:
1. **Ditch Expo & React Native**: Remove all `node_modules`, `package.json`, TypeScript files, and custom Expo config plugins.
2. **Remove Dynamic Island & Widgets**: Delete all ActivityKit and Widget extension targets to simplify architecture to a single, robust native app target.
3. **Immutable Start Time with Elapsed Calculation**: The active timer stores `startTime: Date` and `accumulatedSeconds: TimeInterval`. When returning from background, elapsed time is computed as `Date.now.timeIntervalSince(startTime) + accumulatedSeconds`, eliminating timer drift.
4. **Offline-First SwiftData Storage**: All session records, durations, notes, and categories reside purely in on-device SwiftData with zero network telemetry or third-party SDKs.

---

## 4. UI Specification (Clear Glass Reference)

### Screen 1: Today Main (Dashboard)
* **Header**: "Good morning, Kedar", date badge ("Sat, 5 Sep").
* **Clear Glass Segmented Rhythm Ring**:
  * 4 concentric frosted glass tracks (Sleep 82pt, Focus 70pt, Workout 58pt, Family 46pt).
  * Center: Large 42pt `.monospacedDigit()` Daily Alignment Score (`84 / 100`) + status pill (`★ On Track`).
* **Active Floating Timer Dock**:
  * Translucent glass capsule docked above the cards with pulsing live dot, category label, live ticking `02:14:38`, and Pause / Finish controls.
* **Drift Warning Banner**:
  * Muted rose banner displaying logged YouTube/Instagram leaks (e.g. `⚠ Mindless Screen / Drift Logged: -45m (-5 pts)`).
* **Pillar Cards**:
  * Focus Work card showing progress toward 8.0h and `≥6.0h Locked in`.
  * Workout card showing `Day 5 of 6` weekly progress.
  * Family card and Sleep card with rapid `+` log triggers.

### Screen 2: Focus Chamber
* Full-screen distraction-free glass view for deep work sprints.
* Large monospaced session timer, session target (e.g. `3.0h`), and progress circle.
* Pause / Resume and Finish Block actions with light haptic feedback.

### Screen 3: Quick Block & Drift Log Sheet
* Half-sheet modal for frictionless retroactive logging:
  * Category selector (Focus Work, Workout, Family Time, Drift / Social Leak).
  * Quick increment chips: `+30m`, `+1 hr`, `+2 hr`, or Custom Time Wheel.

### Screen 4: 24-Hour Timeline
* Chronological stream of the day partitioned into color-coded blocks.
* Any unlogged waking gap is transparently highlighted as **Unaccounted Drift**.
* Tap to edit any block; swipe to delete with an instant Undo Toast.

### Screen 5: Weekly Accountability & Trends
* 7-day consistency chart and alignment score average.
* **Workout Recovery Badge**: Track weekly frequency toward the 5–6x goal.
* **Focus Compliance**: Weekday focus distribution and 6h lock-in rate.
* **Drift Audit**: Total hours lost to social media and YouTube, with motivational context (*"-4.2h lost = 2 full workouts or 2 evenings with family"*).

### Screen 6: Calibration & Settings
* Custom tuning for daily focus targets, hard lock-in thresholds, workout session targets, and kid time windows.

---

## 5. Verification & Test Strategy

1. **Scoring Engine Unit Tests**:
   - Verify Focus Work awards 0–30 pts up to 6h, +5 pts/hr from 6–8h, and caps at 40 pts.
   - Verify Workout awards +20 pts on day of workout and computes weekly progress.
   - Verify Drift deduction math (-5 pts / 30m).
   - Verify 100-pt maximum daily cap.
2. **Timer Resilience Tests**:
   - Start session, simulate 2 hours elapsed in background, verify exact time recovery on resume.
   - Pause session, simulate backgrounding, verify paused time does not accumulate.
3. **Build & Sideload Verification**:
   - `xcodegen generate` succeeds cleanly without warnings.
   - GitHub Actions workflow compiles the unsigned `.ipa` artifact.
   - Verified on physical device via SideStore.
