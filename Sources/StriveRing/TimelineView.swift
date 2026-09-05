import SwiftData
import SwiftUI

struct TimelineView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TimeSession.startTime, order: .reverse) private var sessions: [TimeSession]

    @State private var undoSession: TimeSession?

    private var groupedSessions: [(date: Date, sessions: [TimeSession])] {
        let calendar = Calendar.current
        let grouped = Dictionary(grouping: sessions) { session in
            let attributionDate = (session.category == .sleep)
                ? (session.endTime ?? session.startTime.addingTimeInterval(session.durationSeconds))
                : session.startTime
            return calendar.startOfDay(for: attributionDate)
        }
        return grouped
            .map { (date: $0.key, sessions: $0.value.sorted { $0.startTime > $1.startTime }) }
            .sorted { $0.date > $1.date }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.srCanvas.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    // Header
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Chronological Audit")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.srMutedInk)
                        Text("24h Timeline")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(Color.srInk)
                    }
                    .padding(.top, 4)

                    if groupedSessions.isEmpty {
                        emptyTimelineView
                    } else {
                        ForEach(groupedSessions, id: \.date) { group in
                            DayTimelineSection(
                                date: group.date,
                                sessions: group.sessions,
                                allSessions: sessions,
                                onDelete: { session in
                                    deleteSession(session)
                                }
                            )
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 100)
            }

            if let undoSession {
                UndoToast(message: "Deleted \(undoSession.category.title)") {
                    modelContext.insert(undoSession)
                    try? modelContext.save()
                    self.undoSession = nil
                }
                .padding(.horizontal, 18)
                .padding(.bottom, 75)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
    }

    private var emptyTimelineView: some View {
        VStack(spacing: 12) {
            Image(systemName: "clock")
                .font(.system(size: 36))
                .foregroundStyle(Color.srMutedInk)
            Text("No Sessions Logged Yet")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(Color.srInk)
            Text("Start a live focus session or quick-add your sleep and workout from the Today screen.")
                .font(.system(size: 13))
                .foregroundStyle(Color.srMutedInk)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .clearGlass(radius: 20)
    }

    private func deleteSession(_ session: TimeSession) {
        undoSession = session
        modelContext.delete(session)
        try? modelContext.save()

        Task {
            try? await Task.sleep(for: .seconds(4))
            if undoSession?.id == session.id {
                undoSession = nil
            }
        }
    }
}

private struct DayTimelineSection: View {
    let date: Date
    let sessions: [TimeSession]
    let allSessions: [TimeSession]
    let onDelete: (TimeSession) -> Void

    private var dayResult: DayResult {
        AlignmentEngine.calculate(sessions: allSessions, for: date)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Day Section Header
            HStack {
                Text(date.formatted(.dateTime.weekday(.wide).month().day()))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(Color.srInk)

                Spacer()

                Text("\(dayResult.totalScore) pts")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(dayResult.totalScore >= 75 ? Color.srBrand : Color.srDrift)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(dayResult.totalScore >= 75 ? Color.srBrandSoft : Color.srDriftSoft)
                    .clipShape(Capsule())
            }

            // Stream of sessions
            VStack(spacing: 6) {
                ForEach(sessions) { session in
                    TimelineRow(session: session, onDelete: { onDelete(session) })
                }
            }
        }
        .padding(14)
        .clearGlass(radius: 18, padding: 12)
    }
}

private struct TimelineRow: View {
    let session: TimeSession
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            // Time stamp
            Text(session.startTime.formatted(date: .omitted, time: .shortened))
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.srMutedInk)
                .frame(width: 58, alignment: .leading)
                .monospacedDigit()

            // Session Block
            HStack {
                Circle()
                    .fill(Color.pillarColor(for: session.category))
                    .frame(width: 8, height: 8)

                VStack(alignment: .leading, spacing: 1) {
                    Text(session.category.title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.srInk)
                    if let note = session.note, !note.isEmpty {
                        Text(note)
                            .font(.system(size: 10))
                            .foregroundStyle(Color.srMutedInk)
                            .lineLimit(1)
                    }
                }

                Spacer()

                Text(formatDuration(session.durationSeconds))
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(session.category.isNegative ? Color.srDrift : Color.srInk)
                    .monospacedDigit()

                // Delete action button
                Button {
                    onDelete()
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.srMutedInk.opacity(0.6))
                        .frame(width: 24, height: 24)
                }
                .accessibilityLabel("Delete session")
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.pillarSoftColor(for: session.category))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(session.category.isNegative ? Color.srDrift.opacity(0.3) : Color.clear, lineWidth: 1)
            )
        }
    }

    private func formatDuration(_ seconds: TimeInterval) -> String {
        let totalMins = Int(seconds) / 60
        let hours = totalMins / 60
        let mins = totalMins % 60
        if hours > 0 && mins > 0 {
            return "\(hours)h \(mins)m"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(mins)m"
        }
    }
}
