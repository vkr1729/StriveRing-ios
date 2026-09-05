import SwiftUI

// MARK: - Semantic Design Tokens

extension Color {
    static let srCanvas = Color(red: 0.949, green: 0.961, blue: 0.973) // #F2F5F8
    static let srSurface = Color.white.opacity(0.92)
    static let srSurfaceMuted = Color(red: 0.929, green: 0.945, blue: 0.957) // #EDF1F4
    static let srInk = Color(red: 0.067, green: 0.075, blue: 0.090) // #111317
    static let srMutedInk = Color(red: 0.392, green: 0.420, blue: 0.455) // #646B74
    static let srLine = Color(red: 0.353, green: 0.412, blue: 0.471).opacity(0.16)

    static let srBrand = Color(red: 0.141, green: 0.416, blue: 0.353) // #246A5A
    static let srBrandDeep = Color(red: 0.122, green: 0.255, blue: 0.271) // #1F4145
    static let srBrandSoft = Color(red: 0.875, green: 0.933, blue: 0.914) // #DFEEE9

    static let srFocus = Color(red: 0.000, green: 0.529, blue: 0.424) // #00876C
    static let srFocusSoft = Color(red: 0.878, green: 0.949, blue: 0.945) // #E0F2F1

    static let srSleep = Color(red: 0.290, green: 0.333, blue: 0.635) // #4A55A2
    static let srSleepSoft = Color(red: 0.933, green: 0.949, blue: 1.000) // #EEF2FF

    static let srWorkout = Color(red: 0.008, green: 0.518, blue: 0.780) // #0284C7
    static let srWorkoutSoft = Color(red: 0.878, green: 0.949, blue: 0.996) // #E0F2FE

    static let srFamily = Color(red: 0.851, green: 0.467, blue: 0.024) // #D97706
    static let srFamilySoft = Color(red: 0.996, green: 0.953, blue: 0.780) // #FEF3C7

    static let srDrift = Color(red: 0.882, green: 0.114, blue: 0.282) // #E11D48
    static let srDriftSoft = Color(red: 1.000, green: 0.894, blue: 0.902) // #FFE4E6

    static func pillarColor(for kind: PillarKind) -> Color {
        switch kind {
        case .focusWork: return .srFocus
        case .workout: return .srWorkout
        case .sleep: return .srSleep
        case .family: return .srFamily
        case .drift: return .srDrift
        }
    }

    static func pillarSoftColor(for kind: PillarKind) -> Color {
        switch kind {
        case .focusWork: return .srFocusSoft
        case .workout: return .srWorkoutSoft
        case .sleep: return .srSleepSoft
        case .family: return .srFamilySoft
        case .drift: return .srDriftSoft
        }
    }
}

// MARK: - Clear Glass Card Modifier

struct ClearGlassCard: ViewModifier {
    var radius: CGFloat = 20
    var padding: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Color.srSurface)
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .stroke(Color.srLine, lineWidth: 1)
            )
            .shadow(color: Color.srInk.opacity(0.04), radius: 10, x: 0, y: 4)
    }
}

extension View {
    func clearGlass(radius: CGFloat = 20, padding: CGFloat = 16) -> some View {
        modifier(ClearGlassCard(radius: radius, padding: padding))
    }
}

// MARK: - 4-Track Clear Glass Segmented Rhythm Ring

struct ClearGlassRhythmRing: View {
    let result: DayResult

    private var sleepFraction: Double {
        result.pillarScore(for: .sleep).progressFraction
    }

    private var focusFraction: Double {
        result.pillarScore(for: .focusWork).progressFraction
    }

    private var workoutFraction: Double {
        result.pillarScore(for: .workout).progressFraction
    }

    private var familyFraction: Double {
        result.pillarScore(for: .family).progressFraction
    }

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                // Background Track Rings
                RingTrack(radius: 82, strokeWidth: 8, color: Color.srLine, isDashed: true)
                RingTrack(radius: 70, strokeWidth: 8, color: Color.srLine)
                RingTrack(radius: 58, strokeWidth: 8, color: Color.srLine)
                RingTrack(radius: 46, strokeWidth: 8, color: Color.srLine)

                // Active Progress Arcs
                // Track 1: Sleep (Outer, r=82)
                ProgressArc(radius: 82, strokeWidth: 8, color: .srSleep, fraction: sleepFraction)

                // Track 2: Focus Work (r=70)
                ProgressArc(radius: 70, strokeWidth: 8, color: .srFocus, fraction: focusFraction)

                // Track 3: Workout (r=58)
                ProgressArc(radius: 58, strokeWidth: 8, color: .srWorkout, fraction: workoutFraction)

                // Track 4: Family & Kid (Inner, r=46)
                ProgressArc(radius: 46, strokeWidth: 8, color: .srFamily, fraction: familyFraction)

                // Center Score Display
                VStack(spacing: 2) {
                    Text("\(result.totalScore)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.srInk)
                        .monospacedDigit()

                    Text("ALIGNMENT")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(Color.srMutedInk)
                        .tracking(1.2)

                    Text(result.scoreLabel)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(result.totalScore >= 75 ? Color.srBrand : Color.srDrift)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(result.totalScore >= 75 ? Color.srBrandSoft : Color.srDriftSoft)
                        .clipShape(Capsule())
                        .padding(.top, 4)
                }
            }
            .frame(width: 190, height: 190)

            // Mini Legend Row
            HStack(spacing: 12) {
                LegendPill(color: .srSleep, label: "Sleep", value: result.pillarScore(for: .sleep).formattedDuration)
                LegendPill(color: .srFocus, label: "Focus", value: result.pillarScore(for: .focusWork).formattedDuration)
                LegendPill(color: .srWorkout, label: "Workout", value: result.pillarScore(for: .workout).formattedDuration)
                LegendPill(color: .srFamily, label: "Family", value: result.pillarScore(for: .family).formattedDuration)
            }
            .padding(.top, 4)
        }
        .clearGlass(radius: 28, padding: 18)
    }
}

private struct RingTrack: View {
    let radius: CGFloat
    let strokeWidth: CGFloat
    let color: Color
    var isDashed: Bool = false

    var body: some View {
        Circle()
            .stroke(
                color,
                style: StrokeStyle(
                    lineWidth: strokeWidth,
                    lineCap: .round,
                    dash: isDashed ? [3, 6] : []
                )
            )
            .frame(width: radius * 2, height: radius * 2)
    }
}

private struct ProgressArc: View {
    let radius: CGFloat
    let strokeWidth: CGFloat
    let color: Color
    let fraction: Double

    var body: some View {
        Circle()
            .trim(from: 0, to: CGFloat(min(max(fraction, 0), 1.0)))
            .stroke(color, style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round))
            .rotationEffect(.degrees(-90))
            .frame(width: radius * 2, height: radius * 2)
            .animation(.spring(response: 0.4, dampingFraction: 0.75), value: fraction)
    }
}

private struct LegendPill: View {
    let color: Color
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(Color.srMutedInk)
                Text(value)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(Color.srInk)
                    .monospacedDigit()
            }
        }
    }
}

// MARK: - Active Floating Timer Dock

struct ActiveTimerDock: View {
    @Bindable var sessionManager: SessionManager
    let onStop: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Pulsing Live Indicator
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.srFocus)
                    .frame(width: 9, height: 9)
                    .overlay(
                        Circle()
                            .stroke(Color.srFocus.opacity(0.5), lineWidth: 2)
                            .scaleEffect(1.4)
                    )

                VStack(alignment: .leading, spacing: 1) {
                    Text("ACTIVE SESSION")
                        .font(.system(size: 9, weight: .heavy))
                        .foregroundStyle(Color.white.opacity(0.75))
                        .tracking(1.0)
                    Text(sessionManager.activeCategory?.title ?? "Tracking")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color.white)
                        .lineLimit(1)
                }
            }

            Spacer()

            // Timer display
            Text(sessionManager.formattedElapsed)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Color.white)
                .monospacedDigit()

            // Controls
            HStack(spacing: 6) {
                Button {
                    if sessionManager.isPaused {
                        sessionManager.resumeSession()
                    } else {
                        sessionManager.pauseSession()
                    }
                } label: {
                    Image(systemName: sessionManager.isPaused ? "play.fill" : "pause.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.white)
                        .frame(width: 32, height: 32)
                        .background(Color.white.opacity(0.2))
                        .clipShape(Circle())
                }
                .accessibilityLabel(sessionManager.isPaused ? "Resume" : "Pause")

                Button {
                    onStop()
                } label: {
                    Image(systemName: "stop.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.white)
                        .frame(width: 32, height: 32)
                        .background(Color.srDrift)
                        .clipShape(Circle())
                }
                .accessibilityLabel("Stop Session")
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            LinearGradient(
                colors: [Color.srBrandDeep, Color.srBrand],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: Color.srBrand.opacity(0.25), radius: 12, x: 0, y: 6)
    }
}

// MARK: - Drift Alert Banner

struct DriftAlertBanner: View {
    let driftPenaltyPoints: Int
    let driftDurationSeconds: TimeInterval

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color.srDrift)

            VStack(alignment: .leading, spacing: 2) {
                Text("Mindless Screen / Drift Logged")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Color.srDrift)

                let minutes = Int(driftDurationSeconds) / 60
                Text("\(minutes)m total · first 30m grace period exceeded")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Color.srDrift.opacity(0.85))
            }

            Spacer()

            Text("-\(driftPenaltyPoints) pts")
                .font(.system(size: 13, weight: .heavy, design: .rounded))
                .foregroundStyle(Color.srDrift)
                .monospacedDigit()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.srDriftSoft)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.srDrift.opacity(0.25), lineWidth: 1)
        )
    }
}

// MARK: - Undo Toast

struct UndoToast: View {
    let message: String
    let onUndo: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Text(message)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.white)
                .lineLimit(1)

            Spacer()

            Button("Undo") {
                onUndo()
            }
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(Color.srBrandSoft)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.srInk.opacity(0.92))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 6)
    }
}
