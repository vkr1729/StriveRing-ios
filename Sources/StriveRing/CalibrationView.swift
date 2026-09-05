import SwiftData
import SwiftUI

struct CalibrationView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var sessions: [TimeSession]

    @State private var isShowingResetConfirmation = false
    @State private var isExporting = false
    @State private var exportJSONString = ""

    var body: some View {
        ZStack {
            Color.srCanvas.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Profile Tuning")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.srMutedInk)
                        Text("Calibration")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(Color.srInk)
                    }
                    .padding(.top, 4)

                    // Focus Section
                    CalibrationSection(
                        title: "Focus Work Target & Gate",
                        icon: "laptopcomputer",
                        color: .srFocus
                    ) {
                        SettingRow(title: "Daily Focus Requirement", value: "8.0 Hours")
                        SettingRow(title: "Mandatory Minimum Gate", value: "6.0 Hours", subtitle: "Locks in 30/40 points; warns if unfulfilled on weekdays")
                    }

                    // Workout Section
                    CalibrationSection(
                        title: "Workout Turnaround",
                        icon: "figure.run",
                        color: .srWorkout
                    ) {
                        SettingRow(title: "Weekly Consistency Target", value: "5 to 6 Sessions")
                        SettingRow(title: "Qualifying Threshold", value: "≥ 35–40 Mins", subtitle: "Full +20 points awarded for showing up; consistency beats duration")
                    }

                    // Family Section
                    CalibrationSection(
                        title: "Sacred Family & Kid Presence",
                        icon: "figure.2.and.child.holdinghands",
                        color: .srFamily
                    ) {
                        SettingRow(title: "Weekday Evening Window", value: "1.5 to 2.5 Hours", subtitle: "Screen-free dinner, playtime, and bedtime routine")
                        SettingRow(title: "Weekend Target", value: "4.0 Hours", subtitle: "Family presence leads the weekend alignment score (35 pts)")
                    }

                    // Weekend Profile Dynamic Shift
                    CalibrationSection(
                        title: "Weekend Alignment Shift",
                        icon: "sun.max.fill",
                        color: .srBrand
                    ) {
                        SettingRow(title: "Weekend Focus Gate", value: "Deactivated (Optional)", subtitle: "On Saturday & Sunday, focus work is bonus-only so you can rest without guilt")
                        SettingRow(title: "Pillar Priorities", value: "Family + Workout", subtitle: "Weekend alignment is driven by your son's time and hitting 5-6x workouts")
                    }

                    // Drift & Distraction Rules
                    CalibrationSection(
                        title: "Drift & Social Media Rule",
                        icon: "exclamationmark.triangle.fill",
                        color: .srDrift
                    ) {
                        SettingRow(title: "Free Grace Buffer", value: "0 to 30 Mins / Day", subtitle: "Casual decompression during lunch has 0 penalty points")
                        SettingRow(title: "Excess Penalty", value: "-5 pts / 30m excess", subtitle: "Strictly guards against toxic 1-2 hour YouTube & Instagram doomscrolling")
                    }

                    // Data Management
                    VStack(alignment: .leading, spacing: 10) {
                        Text("DATA & BACKUP")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(Color.srMutedInk)
                            .tracking(0.8)

                        Button {
                            exportData()
                        } label: {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Export Sessions JSON (\(sessions.count) sessions)")
                                Spacer()
                            }
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.srInk)
                            .padding(14)
                            .background(Color.srSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color.srLine, lineWidth: 1))
                        }

                        Button(role: .destructive) {
                            isShowingResetConfirmation = true
                        } label: {
                            HStack {
                                Image(systemName: "trash")
                                Text("Reset All Stored Sessions")
                                Spacer()
                            }
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.srDrift)
                            .padding(14)
                            .background(Color.srSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color.srLine, lineWidth: 1))
                        }
                    }
                    .padding(.top, 6)
                    .padding(.bottom, 24)
                }
                .padding(.horizontal, 18)
            }
        }
        .navigationTitle("Calibration")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Reset StriveRing Data?", isPresented: $isShowingResetConfirmation) {
            Button("Delete All Sessions", role: .destructive) {
                sessions.forEach(modelContext.delete)
                try? modelContext.save()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to delete all stored time sessions? This cannot be undone.")
        }
        .sheet(isPresented: $isExporting) {
            ShareSheet(activityItems: [exportJSONString])
        }
    }

    private func exportData() {
        struct ExportItem: Codable {
            let id: String
            let category: String
            let startTime: String
            let durationSeconds: Double
            let note: String?
        }

        let items = sessions.map { session in
            ExportItem(
                id: session.id.uuidString,
                category: session.category.rawValue,
                startTime: session.startTime.ISO8601Format(),
                durationSeconds: session.durationSeconds,
                note: session.note
            )
        }

        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        if let data = try? encoder.encode(items), let jsonStr = String(data: data, encoding: .utf8) {
            exportJSONString = jsonStr
            isExporting = true
        }
    }
}

private struct CalibrationSection<Content: View>: View {
    let title: String
    let icon: String
    let color: Color
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(color)
                Text(title)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color.srInk)
            }

            VStack(spacing: 8) {
                content
            }
        }
        .clearGlass(radius: 18, padding: 14)
    }
}

private struct SettingRow: View {
    let title: String
    let value: String
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(title)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color.srMutedInk)
                Spacer()
                Text(value)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(Color.srInk)
            }

            if let subtitle {
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(Color.srMutedInk.opacity(0.85))
                    .padding(.top, 1)
            }
        }
        .padding(.vertical, 4)
    }
}

private struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
