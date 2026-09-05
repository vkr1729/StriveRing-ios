import SwiftData
import SwiftUI

struct TrendsView: View {
    @Query(sort: \TimeSession.startTime, order: .reverse) private var sessions: [TimeSession]

    private var calendar: Calendar { Calendar.current }

    private var weekInterval: DateInterval {
        calendar.dateInterval(of: .weekOfYear, for: .now) ?? DateInterval(start: .now, duration: 7 * 86400)
    }

    private var weekSessions: [TimeSession] {
        sessions.filter { weekInterval.contains($0.startTime) }
    }

    private var totalFocusHours: Double {
        let focusSeconds = weekSessions.filter { $0.category == .focusWork }.reduce(0) { $0 + $1.durationSeconds }
        return focusSeconds / 3600.0
    }

    private var totalDriftHours: Double {
        let driftSeconds = weekSessions.filter { $0.category == .drift }.reduce(0) { $0 + $1.durationSeconds }
        return driftSeconds / 3600.0
    }

    private var uniqueWorkoutDays: Int {
        let workouts = weekSessions.filter { $0.category == .workout && $0.durationSeconds >= (35.0 * 60) }
        return Set(workouts.map { calendar.startOfDay(for: $0.startTime) }).count
    }

    private var weekdayFocusCompliance: (passed: Int, total: Int) {
        var passed = 0
        var total = 0

        // Check Monday through Friday of the current week up to today
        var current = weekInterval.start
        while current <= .now && current < weekInterval.end {
            if !calendar.isDateInWeekend(current) {
                total += 1
                let res = AlignmentEngine.calculate(sessions: sessions, for: current)
                if res.focusGatePassed {
                    passed += 1
                }
            }
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
        }

        return (passed, max(1, total))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.srCanvas.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Header
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Weekly Report")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color.srMutedInk)
                            Text("Accountability")
                                .font(.system(size: 26, weight: .bold))
                                .foregroundStyle(Color.srInk)
                        }
                        .padding(.top, 4)

                        // 3-Pack Metric Summary
                        HStack(spacing: 8) {
                            MetricBox(
                                value: String(format: "%.1fh", totalFocusHours),
                                label: "Focus Locked",
                                color: .srFocus
                            )

                            MetricBox(
                                value: "\(uniqueWorkoutDays) of 6",
                                label: "Workouts ✓",
                                color: .srWorkout
                            )

                            MetricBox(
                                value: totalDriftHours > 0 ? String(format: "-%.1fh", totalDriftHours) : "0h",
                                label: "Drift Leak",
                                color: .srDrift
                            )
                        }

                        // Workout Habit Turnaround Card (5-6x / week)
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Workout Target: 5–6 / Week")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundStyle(Color.srWorkout)
                                    Text("Rebuilding frequency: 40m sessions count in full")
                                        .font(.system(size: 11))
                                        .foregroundStyle(Color.srMutedInk)
                                }
                                Spacer()
                                let pct = Int((Double(uniqueWorkoutDays) / 6.0) * 100)
                                Text("\(pct)%")
                                    .font(.system(size: 20, weight: .heavy, design: .rounded))
                                    .foregroundStyle(Color.srWorkout)
                                    .monospacedDigit()
                            }

                            // 6-segment habit tracker
                            HStack(spacing: 6) {
                                ForEach(0..<6, id: \.self) { index in
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(index < uniqueWorkoutDays ? Color.srWorkout : Color.srSurfaceMuted)
                                        .frame(height: 8)
                                }
                            }
                        }
                        .clearGlass(radius: 18, padding: 14)

                        // Focus Compliance Card (≥6h Gate)
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Focus Gate Compliance (≥6h)")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(Color.srInk)
                                Spacer()
                                Text("\(weekdayFocusCompliance.passed)/\(weekdayFocusCompliance.total) Weekdays")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Color.srFocus)
                            }

                            Text("Locking in 6.0 hours ensures no weekday slacking. Weekly total: \(String(format: "%.1fh", totalFocusHours)) deep output.")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.srMutedInk)
                        }
                        .clearGlass(radius: 18, padding: 14)

                        // Drift Audit Card
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(Color.srDrift)
                                Text("Weekly Drift Audit")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundStyle(Color.srDrift)
                                Spacer()
                                Text(totalDriftHours > 0 ? String(format: "-%.1fh", totalDriftHours) : "Clean Week")
                                    .font(.system(size: 13, weight: .heavy, design: .rounded))
                                    .foregroundStyle(Color.srDrift)
                            }

                            if totalDriftHours > 0 {
                                Text("You lost \(String(format: "%.1f", totalDriftHours)) hours to social media/video rabbit holes. Reclaiming this time adds \(String(format: "%.0f", totalDriftHours * 60)) minutes of sacred presence with your son.")
                                    .font(.system(size: 11))
                                    .foregroundStyle(Color.srInk.opacity(0.8))
                            } else {
                                Text("Zero mindless drift logged this week. Full presence preserved!")
                                    .font(.system(size: 11))
                                    .foregroundStyle(Color.srBrand)
                            }
                        }
                        .padding(14)
                        .background(Color.srDriftSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(Color.srDrift.opacity(0.25), lineWidth: 1)
                        )

                        // Navigation to Calibration & Settings
                        NavigationLink(destination: CalibrationView()) {
                            HStack {
                                Image(systemName: "gearshape.fill")
                                    .font(.system(size: 14))
                                Text("Target Calibration & Settings")
                                    .font(.system(size: 13, weight: .bold))
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Color.srMutedInk)
                            }
                            .foregroundStyle(Color.srInk)
                            .padding(14)
                            .background(Color.srSurface)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.srLine, lineWidth: 1))
                        }
                        .padding(.top, 4)
                        .padding(.bottom, 100)
                    }
                    .padding(.horizontal, 18)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

private struct MetricBox: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 20, weight: .heavy, design: .rounded))
                .foregroundStyle(color)
                .monospacedDigit()
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(Color.srMutedInk)
                .textCase(.uppercase)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .clearGlass(radius: 14, padding: 0)
    }
}
