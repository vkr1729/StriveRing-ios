# StriveRing

StriveRing is a private, native offline-first iOS 26 application for Kedar. It turns the reality of the 24-hour day (1,440 minutes) into an honest **Daily Alignment Score (0–100)** and a **Clear Glass Segmented Rhythm Ring**.

It is designed for unyielding personal accountability: locking in 8 hours of deep focus with a mandatory 6-hour minimum gate, reviving 5–6 weekly workouts with full credit for 40-minute sessions, safeguarding uninterrupted evening presence with his growing son, and catching mindless social media drift before it consumes the day.

## What is implemented

- **100% Native SwiftUI & SwiftData**: Zero npm/JavaScript dependencies, instant 120Hz micro-interactions, and native Clear Glass materials.
- **Clear Glass Segmented Rhythm Ring**: 4 concentric progress tracks (Sleep, Focus Work, Workout, Family Time) with tabular `.monospacedDigit()` alignment score.
- **Focus Gate Accountability**: 8.0h daily weekday target with a mandatory **≥6.0h lock-in milestone** (+30 pts up to 6h, max 40 pts).
- **Workout Rebound (5–6x / Week)**: Flexible qualifying threshold (**≥ 35–40 mins**) awarding full **+20 points** and tracking weekly consistency (`Day X of 6`).
- **Sacred Family Presence**: 1.5–2.5h dedicated screen-free evening presence (dinner, play, bedtime). Expands to 4.0h on weekends.
- **Drift & Social Media Audit**: 30-minute free grace buffer (0 penalty); excess video/social scrolling deducts **-5 pts per 30m**; unlogged waking gaps > 5.0h trigger a gentle upkeep reminder.
- **Active Floating Stopwatch Dock**: Running session timer with zero clock drift across backgrounding, plus runaway session safeguards.
- **24-Hour Timeline & Weekly Trends**: Chronological daily stream, consistency streaks, focus compliance, and data export.
- **GitHub Actions CI/CD**: Unsigned IPA workflow producing ready-to-sideload `.ipa` for **SideStore / LiveContainer**.

## Build & Sideloading

The repository uses [XcodeGen](https://github.com/yonaskolb/XcodeGen) so generated Xcode project files do not need to be committed.

```bash
xcodegen generate
open StriveRing.xcodeproj
```

Target: iOS 26+, iPhone only. Light-mode first.
On Ubuntu Linux, push to GitHub and download the `StriveRing-unsigned-ipa` artifact from the **Build StriveRing iOS** workflow run, then import into **SideStore** or **LiveContainer**.

## Sources of truth

- `PROJECT.md` — project blueprint, scoring equations, and system architecture.
- `design-system/strivering/MASTER.md` — selected Clear Glass tokens and rules.
- `DESIGN_DECISION.md` — comparison of 5 visual directions and why Clear Glass Signature won.
- `UAT.md` — automated acceptance journeys on iPhone 17 (iOS 26.5).
- `mockups/strivering-mockups.html` — interactive visual board with real-time day simulation scrubber.
