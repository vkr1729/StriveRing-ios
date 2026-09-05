import SwiftUI

struct FocusChamberView: View {
    @Bindable var sessionManager: SessionManager
    let onFinish: () -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var plannedTargetHours: Double = 3.0

    var body: some View {
        ZStack {
            Color.srCanvas.ignoresSafeArea()

            VStack(spacing: 24) {
                // Top dismiss bar
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "chevron.down")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.srMutedInk)
                            .frame(width: 36, height: 36)
                            .background(Color.srSurface)
                            .clipShape(Circle())
                    }
                    Spacer()
                    Text("DEEP WORK CHAMBER")
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(Color.srFocus)
                        .tracking(1.2)
                    Spacer()
                    Color.clear.frame(width: 36, height: 36)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)

                Spacer()

                // Session Intention
                VStack(spacing: 6) {
                    Text(sessionManager.sessionNote ?? "Intentional Deep Sprint")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Color.srInk)
                        .multilineTextAlignment(.center)
                    Text("8.0h Daily Target · ≥6.0h Mandatory Lock-in")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.srMutedInk)
                }

                // Central Radial Glass Gauge
                ZStack {
                    // Background circle
                    Circle()
                        .stroke(Color.srLine, lineWidth: 8)
                        .frame(width: 240, height: 240)

                    // Active progress arc (relative to planned target)
                    let fraction = min(sessionManager.elapsedSeconds / (plannedTargetHours * 3600), 1.0)
                    Circle()
                        .trim(from: 0, to: CGFloat(max(fraction, 0.01)))
                        .stroke(Color.srFocus, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 240, height: 240)
                        .animation(.spring, value: fraction)

                    VStack(spacing: 6) {
                        Text(sessionManager.formattedElapsed)
                            .font(.system(size: 44, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.srInk)
                            .monospacedDigit()

                        Text("TARGET: \(Int(plannedTargetHours))H")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(Color.srMutedInk)
                            .tracking(1.0)
                    }
                }
                .padding(.vertical, 12)

                // Status Nudge
                let currentTotalFocusHours = (sessionManager.elapsedSeconds / 3600.0)
                let remainingToGate = max(0, 6.0 - currentTotalFocusHours)
                if remainingToGate > 0 {
                    HStack(spacing: 6) {
                        Image(systemName: "lock.fill")
                            .font(.system(size: 11, weight: .bold))
                        Text(String(format: "%.1fh remaining to unlock the 6.0h Gate", remainingToGate))
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundStyle(Color.srFocus)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.srFocusSoft)
                    .clipShape(Capsule())
                } else {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 11, weight: .bold))
                        Text("★ 6.0h Mandatory Lock-in Achieved")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(Color.srBrand)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.srBrandSoft)
                    .clipShape(Capsule())
                }

                Spacer()

                // Actions
                HStack(spacing: 12) {
                    Button {
                        if sessionManager.isPaused {
                            sessionManager.resumeSession()
                        } else {
                            sessionManager.pauseSession()
                        }
                    } label: {
                        Text(sessionManager.isPaused ? "Resume" : "Pause")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.srInk)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Color.srSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.srLine, lineWidth: 1))
                    }

                    Button {
                        onFinish()
                        dismiss()
                    } label: {
                        Text("Finish Block")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Color.srBrand)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 28)
            }
        }
    }
}
