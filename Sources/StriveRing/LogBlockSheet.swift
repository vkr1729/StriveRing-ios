import SwiftUI

struct LogBlockSheet: View {
    @Environment(\.dismiss) private var dismiss
    let initialCategory: PillarKind
    let onSave: (TimeSession) -> Void

    @State private var selectedCategory: PillarKind
    @State private var durationMinutes: Int = 60
    @State private var sessionNote: String = ""

    init(initialCategory: PillarKind = .focusWork, onSave: @escaping (TimeSession) -> Void) {
        self.initialCategory = initialCategory
        self._selectedCategory = State(initialValue: initialCategory)
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.srCanvas.ignoresSafeArea()

                VStack(spacing: 20) {
                    // Category Selection Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        ForEach(PillarKind.allCases) { kind in
                            Button {
                                selectedCategory = kind
                                setDefaultDuration(for: kind)
                            } label: {
                                HStack(spacing: 8) {
                                    Image(systemName: kind.symbol)
                                        .font(.system(size: 12, weight: .bold))
                                    Text(kind.shortTitle)
                                        .font(.system(size: 13, weight: .bold))
                                    Spacer()
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .foregroundStyle(selectedCategory == kind ? Color.white : Color.srInk)
                                .background(selectedCategory == kind ? Color.pillarColor(for: kind) : Color.srSurface)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(selectedCategory == kind ? Color.clear : Color.srLine, lineWidth: 1)
                                )
                            }
                        }
                    }
                    .padding(.top, 4)

                    // Quick Increment Chips
                    VStack(alignment: .leading, spacing: 8) {
                        Text("QUICK DURATION")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(Color.srMutedInk)
                            .tracking(0.8)

                        HStack(spacing: 8) {
                            ForEach(quickOptions(for: selectedCategory), id: \.self) { mins in
                                Button {
                                    durationMinutes = mins
                                } label: {
                                    Text(formatMinutes(mins))
                                        .font(.system(size: 13, weight: .bold))
                                        .foregroundStyle(durationMinutes == mins ? Color.white : Color.srInk)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(durationMinutes == mins ? Color.srBrand : Color.srSurface)
                                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                                .stroke(durationMinutes == mins ? Color.clear : Color.srLine, lineWidth: 1)
                                        )
                                }
                            }
                        }
                    }

                    // Stepper / Fine-tune
                    HStack {
                        Text("Selected Duration")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Color.srMutedInk)
                        Spacer()
                        Stepper(value: $durationMinutes, in: 5...720, step: 5) {
                            Text(formatMinutes(durationMinutes))
                                .font(.system(size: 18, weight: .bold, design: .rounded))
                                .foregroundStyle(Color.srInk)
                                .monospacedDigit()
                        }
                    }
                    .padding(14)
                    .background(Color.srSurface)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color.srLine, lineWidth: 1))

                    // Drift Grace Rule / Workout Note Box
                    if selectedCategory == .drift {
                        HStack(spacing: 8) {
                            Image(systemName: "info.circle.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(Color.srDrift)
                            Text(durationMinutes <= 30 ? "Within 30m grace buffer (0 penalty)" : "Exceeds 30m buffer (\(driftPenaltyPreview(for: durationMinutes)))")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color.srDrift)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.srDriftSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    } else if selectedCategory == .workout && durationMinutes >= 35 {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(Color.srWorkout)
                            Text("Qualifies for full daily workout credit (+20 pts)")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color.srWorkout)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.srWorkoutSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }

                    // Optional Note Input
                    TextField("Add optional note (e.g. Pull Day, Sprint 1)", text: $sessionNote)
                        .font(.system(size: 13))
                        .padding(14)
                        .background(Color.srSurface)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Color.srLine, lineWidth: 1))

                    Spacer()

                    // Confirm Button
                    Button {
                        let durationSeconds = TimeInterval(durationMinutes * 60)
                        let session = TimeSession(
                            category: selectedCategory,
                            startTime: Date.now.addingTimeInterval(-durationSeconds),
                            endTime: .now,
                            durationSeconds: durationSeconds,
                            note: sessionNote.isEmpty ? nil : sessionNote
                        )
                        onSave(session)
                        dismiss()
                    } label: {
                        Text("Confirm Entry")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Color.srBrand)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .padding(.bottom, 12)
                }
                .padding(.horizontal, 20)
            }
            .navigationTitle("Log Time Block")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.srMutedInk)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func setDefaultDuration(for kind: PillarKind) {
        switch kind {
        case .focusWork: durationMinutes = 90
        case .workout: durationMinutes = 40
        case .sleep: durationMinutes = 450 // 7.5h
        case .family: durationMinutes = 120
        case .drift: durationMinutes = 45
        }
    }

    private func quickOptions(for kind: PillarKind) -> [Int] {
        switch kind {
        case .focusWork: return [30, 60, 90, 120]
        case .workout: return [35, 40, 60, 75]
        case .sleep: return [390, 450, 480, 540] // 6.5h, 7.5h, 8h, 9h
        case .family: return [30, 60, 90, 120]
        case .drift: return [15, 30, 45, 60]
        }
    }

    private func formatMinutes(_ mins: Int) -> String {
        let hours = mins / 60
        let remainder = mins % 60
        if hours > 0 && remainder > 0 {
            return "\(hours)h \(remainder)m"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(mins)m"
        }
    }

    private func driftPenaltyPreview(for mins: Int) -> String {
        if mins <= 30 { return "0 pts" }
        if mins <= 60 { return "-5 pts" }
        if mins <= 90 { return "-10 pts" }
        return "-20 pts max"
    }
}
