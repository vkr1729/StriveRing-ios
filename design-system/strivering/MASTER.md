# StriveRing Design System — Clear Glass

**Status:** Selected implementation reference (Direction D)  
**Target:** Native SwiftUI, iOS 26+, iPhone 16/Pro primary  
**Mode:** Light-first; system dark mode supported via semantic tokens  
**Design Dials:** Variance 2/10, Motion 2/10, Density 5/10  

---

## 1. Intent

StriveRing is an intentional, calm time-rhythm instrument. It provides unyielding accountability for where your 24 hours go—locking in 8 hours of deep focus, reviving 5–6 weekly workouts, preserving evening presence with your kid, and mercilessly exposing mindless screen drift.

---

## 2. Semantic Palette

| Token | Light Value | Usage |
| :--- | :--- | :--- |
| `canvas` | `#F2F5F8` | Main application background |
| `surface` | `#FFFFFF` (88–96%) | Translucent glass cards and containers |
| `surfaceMuted` | `#EDF1F4` | Unselected controls, inactive track backgrounds |
| `ink` | `#111317` | Primary typography |
| `mutedInk` | `#646B74` | Secondary text, timestamps, captions |
| `line` | `rgba(90, 105, 120, 0.16)` | Subtle hairlines and card borders |
| `brand` | `#246A5A` | Primary actions, confirmation buttons, status badges |
| `brandDeep` | `#1F4145` | Gradient end for active docks and heroes |
| `brandSoft` | `#DFEEE9` | Positive tint, completed goal badge backgrounds |
| `focusColor` | `#00876C` | Focus Work pillar (8h target, ≥6h lock-in) |
| `focusSoft` | `#E0F2F1` | Focus chip backgrounds and timeline blocks |
| `sleepColor` | `#4A55A2` | Sleep pillar (7.5–8.5h target) |
| `sleepSoft` | `#EEF2FF` | Sleep chip backgrounds |
| `workoutColor` | `#0284C7` | Workout pillar (5–6x / week, 45–60 min) |
| `workoutSoft` | `#E0F2FE` | Workout chip backgrounds |
| `familyColor` | `#D97706` | Family & Kid pillar (1.5–2.5h target) |
| `familySoft` | `#FEF3C7` | Family chip backgrounds |
| `driftColor` | `#E11D48` | Drift & Distraction (YouTube, Instagram leak) |
| `driftSoft` | `#FFE4E6` | Drift alert banners and timeline leaks |

---

## 3. Typography & Numerals

* **Font System**: San Francisco via SwiftUI Dynamic Type.
* **Headers**: `.largeTitle.bold()` with tight tracking (`-0.04em`).
* **Score & Timers**: All alignment scores and stopwatch durations **must** use `.monospacedDigit()` to prevent visual jitter.
* **No Emojis as Icons**: Use standard SF Symbols (`figure.run`, `laptopcomputer`, `moon.zzz.fill`, `figure.2.and.child.holdinghands`, `exclamationmark.triangle.fill`).

---

## 4. Geometry & Spacing

* **Base Rhythm**: 4-point grid (4, 8, 12, 16, 20, 24, 32 pt).
* **Corner Radius**:
  * Outer Phone Display: 43 pt
  * Hero Ring Card: 28 pt
  * Standard Cards: 20 pt
  * Quick Buttons / Pills: 12–14 pt
* **Touch Targets**: Minimum 44 × 44 pt with at least 8 pt separation.

---

## 5. Components

### A. Clear Glass Segmented Rhythm Ring
* 4 concentric circular tracks:
  1. Outer track: Sleep (82 pt radius)
  2. Middle track 1: Focus Work (70 pt radius)
  3. Middle track 2: Workout (58 pt radius)
  4. Inner track: Family / Kid Time (46 pt radius)
* Center display: Tabular 42 pt Daily Alignment Score (0–100) + status pill (`★ On Track`, `≥6h Locked`).

### B. Active Floating Timer Dock
* Translucent dark forest gradient capsule (`#1F4145` ➔ `#246A5A`).
* Pulsing live emerald dot, category name, `.monospacedDigit()` timer (`02:14:38`), and Pause / Stop actions.
* Resilient: Records `startTime: Date`, calculates elapsed time on foreground without drift.

### C. Drift Alert Banner
* High-contrast muted rose container (`#FFE4E6`) with bold crimson alert (`#E11D48`).
* Displays logged or detected mindless screen drift (e.g. `-45m (-5 pts)`).

### D. 24-Hour Timeline
* Chronological stream of the day’s waking and sleeping hours.
* Transparent audit of unallocated time.
