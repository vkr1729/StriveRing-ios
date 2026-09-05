# StriveRing Simulator UAT

## Purpose

Validate the complete daily time rhythm, active timer resilience, focus lock-in gate, workout turnaround, and drift audit on an iPhone 17 simulator running iOS 26.5.

## Automated Acceptance Journeys

1. **Active Stopwatch & Background Resilience**
   - Start an active Focus Work session in the floating dock.
   - Pause session, simulate background elapsed time, and resume. Verify exact elapsed seconds calculation with zero timer drift.
   - Conclude session and verify immediate SwiftData persistence and ring recalculation.

2. **Enforce the 8h Focus Work & 6h Lock-in Gate**
   - On a weekday, log 4.0h Focus: verify score is 20 pts and badge warns *"2.0h remaining to 6h lock-in gate"*.
   - Log past 6.0h: verify milestone unlocks +30 pts and displays `★ 6.0h Gate Achieved`.
   - Log past 8.0h: verify score caps at 40 pts without infinite over-farming.

3. **Workout Rebound & 40-Minute Full Credit**
   - Log a 40-minute workout session.
   - Verify it receives full **+20 points** and advances the weekly consistency badge (`Day 5 of 6`).

4. **Drift Buffer & Penalty Rule**
   - Log 25 minutes of YouTube: verify **0 penalty points** (within the 30-min free grace buffer).
   - Log 45 minutes of YouTube: verify **-5 points** penalty triggers and displays in the alert banner.
   - Verify unlogged waking gaps > 5.0 hours trigger the upkeep check reminder on the 24-hour timeline.

5. **Weekend Dynamic Profile Shift**
   - Set day to Saturday: verify 8h Focus gate is suspended and Family + Workout drive the daily alignment.

6. **Information Architecture & Adaptive Navigation**
   - Verify all 3 primary tabs (`Today`, `Timeline`, `Trends`) and sheets (`Focus Chamber`, `Log Block`) render cleanly in light-first Clear Glass.
   - Verify touch targets meet or exceed 44 × 44 pt and support Dynamic Type.

## Release Gate

- All unit tests and all 6 simulator UAT journeys pass cleanly on iOS 26.5.
- Zero crash, zero timer drift, zero lost sessions, and zero visual truncation.
- A fresh, sideloadable `StriveRing-unsigned-ipa` is generated and uploaded as a GitHub Actions artifact.
