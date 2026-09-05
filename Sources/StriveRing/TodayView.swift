import SwiftData
import SwiftUI

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TimeSession.startTime, order: .reverse) private var sessions: [TimeSession]

    @State private var sessionManager = SessionManager.shared
    @State private var isShowingLogSheet = false
    @State private var selectedLogCategory: PillarKind? = nil
    @State private var isShowingFocusChamber = false
    @State private var undoSession: TimeSession? = nil

    private var todayResult: DayResult {
        AlignmentEngine.calculate(sessions: sessions, for: .now)
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.srCanvas.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    // Header
                    HStack(alignment: .firstTextBaseline) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Good morning, Kedar")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color.srMutedInk)
                            Text("Today’s Rhythm")
                                .font(.system(size: 26, weight: .bold))
                                .foregroundStyle(Color.srInk)
                        }

                        Spacer()

                        Text(Date.now.formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated)))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Color.srMutedInk)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.srSurface)
                            .clipShape(Capsule())
                            .overlay(Capsule().stroke(Color.srLine, lineWidth: 1))
                    }
                    .padding(.top, 4)

                    // Hero Rhythm Ring
                    ClearGlassRhythmRing(result: todayResult)

                    // Active Timer Dock (or Idle Quick-Start Bar)
                    if sessionManager.isRunning {
                        ActiveTimerDock(sessionManager: sessionManager) {
                            concludeActiveSession()
                        }
                        .onTapGesture {
                            if sessionManager.activeCategory == .focusWork {
                                isShowingFocusChamber = true
                            }
                        }
                    } else {
                        idleQuickBar
                    }

                    // Drift Leak Warning (if penalty applied)
                    if todayResult.driftPenaltyPoints > 0 {
                        let driftDuration = todayResult.pillarScore(for: .drift).durationSeconds
                        DriftAlertBanner(
                            driftPenaltyPoints: todayResult.driftPenaltyPoints,
                            driftDurationSeconds: driftDuration
                        )
                    }

                    // Upkeep Gap Anomaly Reminder (if gap > 5h)
                    if todayResult.isUnloggedGapHigh {
                        unloggedGapReminder
                    }

                    // Pillar Progress Cards (2x2 Grid)
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        PillarCard(
                            pillar: .focusWork,
                            score: todayResult.pillarScore(for: .focusWork),
                            onQuickAdd: { openLog(for: .focusWork) }
                        )

                        PillarCard(
                            pillar: .workout,
                            score: todayResult.pillarScore(for: .workout),
                            customSubtitle: "Weekly: Day \(todayResult.workoutCountThisWeek) of 6",
                            onQuickAdd: { openLog(for: .workout) }
                        )

                        PillarCard(
                            pillar: .sleep,
                            score: todayResult.pillarScore(for: .sleep),
                            onQuickAdd: { openLog(for: .sleep) }
                        )

                        PillarCard(
                            pillar: .family,
                            score: todayResult.pillarScore(for: .family),
                            onQuickAdd: { openLog(for: .family) }
                        )
                    }

                    // Log Drift Button
                    Button {
                        openLog(for: .drift)
                    } label: {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.system(size: 12, weight: .bold))
                            Text("Log Social Media / YouTube Leak")
                                .font(.system(size: 12, weight: .bold))
                            Spacer()
                            Text("+ Log")
                                .font(.system(size: 11, weight: .bold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.srDrift.opacity(0.12))
                                .clipShape(Capsule())
                        }
                        .foregroundStyle(Color.srDrift)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color.srSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(Color.srDrift.opacity(0.2), lineWidth: 1)
                        )
                    }
                    .padding(.top, 4)
                    .padding(.bottom, 100)
                }
                .padding(.horizontal, 18)
            }

            // Undo Toast
            if let undoSession {
                UndoToast(message: "Logged \(undoSession.category.title)") {
                    modelContext.delete(undoSession)
                    try? modelContext.save()
                    self.undoSession = nil
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 75)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .sheet(isPresented: $isShowingLogSheet) {
            LogBlockSheet(initialCategory: selectedLogCategory ?? .focusWork) { session in
                modelContext.insert(session)
                try? modelContext.save()
                self.undoSession = session
                Task {
                    try? await Task.sleep(for: .seconds(4))
                    if self.undoSession?.id == session.id {
                        self.undoSession = nil
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $isShowingFocusChamber) {
            FocusChamberView(sessionManager: sessionManager) {
                concludeActiveSession()
                isShowingFocusChamber = false
            }
        }
        .alert("Runaway Session Detected", isPresented: $sessionManager.isShowingRunawayPrompt) {
            Button("Keep Actual (\(sessionManager.formattedElapsed))") {
                sessionManager.isShowingRunawayPrompt = false
            }
            Button("Trim to 3.0 Hours") {
                if let session = sessionManager.trimSession(to: 3.0 * 3600) {
                    modelContext.insert(session)
                    try? modelContext.save()
                }
            }
            Button("Trim to 4.0 Hours") {
                if let session = sessionManager.trimSession(to: 4.0 * 3600) {
                    modelContext.insert(session)
                    try? modelContext.save()
                }
            }
            Button("Cancel", role: .cancel) {
                sessionManager.cancelSession()
            }
        } message: {
            Text("This session has been running for over 4 continuous hours. Did you work the entire time, or would you like to trim it to a realistic focus block?")
        }
    }

    // MARK: - Subviews

    private var idleQuickBar: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("START A LIVE SESSION")
                .font(.system(size: 10, weight: .heavy))
                .foregroundStyle(Color.srMutedInk)
                .tracking(0.8)

            HStack(spacing: 8) {
                QuickStartButton(pillar: .focusWork) {
                    sessionManager.startSession(category: .focusWork)
                    isShowingFocusChamber = true
                }

                QuickStartButton(pillar: .workout) {
                    sessionManager.startSession(category: .workout)
                }

                QuickStartButton(pillar: .family) {
                    sessionManager.startSession(category: .family)
                }
            }
        }
        .clearGlass(radius: 18, padding: 12)
    }

    private var unloggedGapReminder: some View {
        HStack(spacing: 10) {
            Image(systemName: "clock.arrow.circlepath")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(Color.srBrand)

            VStack(alignment: .leading, spacing: 2) {
                Text("Unlogged Waking Gap (>5.0h)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Color.srInk)
                Text("Did you forget to log a focus sprint or gym workout?")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(Color.srMutedInk)
            }

            Spacer()

            Button("+ Log") {
                openLog(for: .focusWork)
            }
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(Color.srBrand)
        }
        .padding(12)
        .background(Color.srSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.srLine, lineWidth: 1)
        )
    }

    // MARK: - Actions

    private func openLog(for category: PillarKind) {
        selectedLogCategory = category
        isShowingLogSheet = true
    }

    private func concludeActiveSession() {
        if let session = sessionManager.stopSession() {
            modelContext.insert(session)
            try? modelContext.save()
            self.undoSession = session
            Task {
                try? await Task.sleep(for: .seconds(4))
                if self.undoSession?.id == session.id {
                    self.undoSession = nil
                }
            }
        }
    }
}

// MARK: - Subcomponents

private struct QuickStartButton: View {
    let pillar: PillarKind
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: pillar.symbol)
                    .font(.system(size: 11, weight: .bold))
                Text(pillar.shortTitle)
                    .font(.system(size: 12, weight: .bold))
            }
            .foregroundStyle(Color.pillarColor(for: pillar))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(Color.pillarSoftColor(for: pillar))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }
}

private struct PillarCard: View {
    let pillar: PillarKind
    let score: PillarScore
    var customSubtitle: String? = nil
    let onQuickAdd: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(pillar.shortTitle)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.pillarColor(for: pillar))

                Spacer()

                Button {
                    onQuickAdd()
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color.srMutedInk)
                        .frame(width: 22, height: 22)
                        .background(Color.srSurfaceMuted)
                        .clipShape(Circle())
                }
            }

            Text(score.formattedDuration)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Color.srInk)
                .monospacedDigit()

            // Progress Bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.srSurfaceMuted)
                        .frame(height: 5)

                    Capsule()
                        .fill(Color.pillarColor(for: pillar))
                        .frame(width: max(0, min(geo.size.width * score.progressFraction, geo.size.width)), height: 5)
                }
            }
            .frame(height: 5)

            HStack {
                Text(customSubtitle ?? score.statusNote)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.srMutedInk)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)

                Spacer()

                Text("+\(Int(score.points)) pts")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(Color.srInk)
                    .monospacedDigit()
            }
        }
        .clearGlass(radius: 18, padding: 12)
    }
}
