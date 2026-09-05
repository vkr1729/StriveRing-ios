import Foundation
import SwiftData
import SwiftUI

// MARK: - SwiftData Model

@Model
final class TimeSession {
    @Attribute(.unique) var id: UUID
    var categoryRawValue: String
    var startTime: Date
    var endTime: Date?
    var durationSeconds: TimeInterval
    var note: String?

    init(
        id: UUID = UUID(),
        category: PillarKind,
        startTime: Date = .now,
        endTime: Date? = nil,
        durationSeconds: TimeInterval = 0,
        note: String? = nil
    ) {
        self.id = id
        self.categoryRawValue = category.rawValue
        self.startTime = startTime
        self.endTime = endTime
        self.durationSeconds = durationSeconds
        self.note = note
    }

    var category: PillarKind {
        get { PillarKind(rawValue: categoryRawValue) ?? .focusWork }
        set { categoryRawValue = newValue.rawValue }
    }
}

// MARK: - Pillar Categories

enum PillarKind: String, CaseIterable, Codable, Identifiable, Sendable {
    case focusWork
    case workout
    case sleep
    case family
    case drift

    var id: String { rawValue }

    var title: String {
        switch self {
        case .focusWork: "Focus Work"
        case .workout: "Workout"
        case .sleep: "Restorative Sleep"
        case .family: "Family & Kid Time"
        case .drift: "Drift / Social Leak"
        }
    }

    var shortTitle: String {
        switch self {
        case .focusWork: "Focus"
        case .workout: "Workout"
        case .sleep: "Sleep"
        case .family: "Family"
        case .drift: "Drift"
        }
    }

    var symbol: String {
        switch self {
        case .focusWork: "laptopcomputer"
        case .workout: "figure.run"
        case .sleep: "moon.zzz.fill"
        case .family: "figure.2.and.child.holdinghands"
        case .drift: "exclamationmark.triangle.fill"
        }
    }

    var defaultTargetSeconds: TimeInterval {
        switch self {
        case .focusWork: 8.0 * 3600 // 8 hours
        case .workout: 45.0 * 60    // 45 mins target (35m qualifying)
        case .sleep: 8.0 * 3600     // 8 hours
        case .family: 2.0 * 3600    // 2 hours
        case .drift: 0.0            // 0 drift desired
        }
    }

    var isNegative: Bool {
        self == .drift
    }
}

// MARK: - Pillar Score Breakdown

struct PillarScore: Equatable, Sendable {
    let pillar: PillarKind
    let durationSeconds: TimeInterval
    let targetSeconds: TimeInterval
    let points: Double
    let maxPoints: Double
    let isCompleted: Bool
    let statusNote: String

    var progressFraction: Double {
        guard targetSeconds > 0 else { return 0 }
        return min(durationSeconds / targetSeconds, 1.0)
    }

    var formattedDuration: String {
        let hours = Int(durationSeconds) / 3600
        let minutes = (Int(durationSeconds) % 3600) / 60
        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    var formattedTarget: String {
        let hours = Int(targetSeconds) / 3600
        let minutes = (Int(targetSeconds) % 3600) / 60
        if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(minutes)m"
        }
    }
}

// MARK: - Daily Result Snapshot

struct DayResult: Equatable, Sendable {
    let date: Date
    let isWeekend: Bool
    let totalScore: Int
    let pillars: [PillarKind: PillarScore]
    let focusGatePassed: Bool
    let focusRemainingToGate: TimeInterval
    let workoutCountThisWeek: Int
    let driftPenaltyPoints: Int
    let unloggedGapSeconds: TimeInterval
    let isUnloggedGapHigh: Bool

    var scoreLabel: String {
        if totalScore >= 90 { return "★ Exceptional Alignment" }
        if totalScore >= 75 { return "On Track" }
        if totalScore >= 50 { return "Moderate Alignment" }
        return "Needs Realignment"
    }

    func pillarScore(for kind: PillarKind) -> PillarScore {
        pillars[kind] ?? PillarScore(
            pillar: kind,
            durationSeconds: 0,
            targetSeconds: kind.defaultTargetSeconds,
            points: 0,
            maxPoints: 0,
            isCompleted: false,
            statusNote: ""
        )
    }
}

// MARK: - Alignment Scoring Engine

enum AlignmentEngine {
    static let weekdayFocusTarget: TimeInterval = 8.0 * 3600       // 8.0 hours
    static let weekdayFocusGate: TimeInterval = 6.0 * 3600         // 6.0 hours hard gate
    static let workoutQualifyingDuration: TimeInterval = 35.0 * 60 // 35 mins
    static let driftGraceBuffer: TimeInterval = 30.0 * 60          // 30 mins free buffer
    static let unloggedGapThreshold: TimeInterval = 5.0 * 3600     // 5.0 hours anomaly

    static func calculate(
        sessions: [TimeSession],
        for date: Date = .now,
        calendar: Calendar = .current
    ) -> DayResult {
        let dayStart = calendar.startOfDay(for: date)
        guard let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) else {
            fatalError("Invalid calendar day calculation")
        }

        // Filter sessions for this specific day
        let daySessions = sessions.filter { session in
            session.startTime >= dayStart && session.startTime < dayEnd
        }

        // Aggregate durations by pillar
        var durations: [PillarKind: TimeInterval] = [:]
        for kind in PillarKind.allCases {
            durations[kind] = 0
        }
        for session in daySessions {
            durations[session.category, default: 0] += session.durationSeconds
        }

        let isWeekend = calendar.isDateInWeekend(date)

        // 1. Focus Work Scoring
        let focusDuration = durations[.focusWork, default: 0]
        let focusScore: PillarScore
        let focusGatePassed: Bool
        let focusRemainingToGate: TimeInterval

        if isWeekend {
            // Weekend shift: Focus is optional (bonus up to 15 pts)
            let bonusPts = min((focusDuration / (4.0 * 3600)) * 15.0, 15.0)
            focusGatePassed = true
            focusRemainingToGate = 0
            focusScore = PillarScore(
                pillar: .focusWork,
                durationSeconds: focusDuration,
                targetSeconds: 4.0 * 3600,
                points: bonusPts,
                maxPoints: 15.0,
                isCompleted: focusDuration >= (2.0 * 3600),
                statusNote: "Optional on Weekends"
            )
        } else {
            // Weekday: 8h target, 6h hard gate (max 40 pts)
            focusGatePassed = focusDuration >= weekdayFocusGate
            focusRemainingToGate = max(0, weekdayFocusGate - focusDuration)

            let pts: Double
            let note: String
            if focusDuration < weekdayFocusGate {
                // Below 6h gate: linear up to 30 pts (5 pts/hr)
                pts = (focusDuration / weekdayFocusGate) * 30.0
                let remHours = focusRemainingToGate / 3600.0
                note = String(format: "%.1fh to unlock 6h gate", remHours)
            } else {
                // 6h to 8h: 30 pts + remaining 10 pts
                let excess = min(focusDuration - weekdayFocusGate, 2.0 * 3600)
                let extraPts = (excess / (2.0 * 3600)) * 10.0
                pts = min(30.0 + extraPts, 40.0)
                note = focusDuration >= weekdayFocusTarget ? "8h Target Met · Max Credit" : "★ 6.0h Gate Locked In"
            }

            focusScore = PillarScore(
                pillar: .focusWork,
                durationSeconds: focusDuration,
                targetSeconds: weekdayFocusTarget,
                points: pts,
                maxPoints: 40.0,
                isCompleted: focusGatePassed,
                statusNote: note
            )
        }

        // 2. Workout Scoring (Flexible 35-40 min session = 20 pts)
        let workoutDuration = durations[.workout, default: 0]
        let workoutQualifies = workoutDuration >= workoutQualifyingDuration
        let workoutPts = workoutQualifies ? 20.0 : (workoutDuration / workoutQualifyingDuration) * 15.0
        let workoutScore = PillarScore(
            pillar: .workout,
            durationSeconds: workoutDuration,
            targetSeconds: 45.0 * 60,
            points: min(workoutPts, 20.0),
            maxPoints: 20.0,
            isCompleted: workoutQualifies,
            statusNote: workoutQualifies ? "Full Credit (+20 pts)" : "Target: 40m session"
        )

        // Count qualifying workouts in the current week (Monday to Sunday)
        let weekInterval = calendar.dateInterval(of: .weekOfYear, for: date) ?? DateInterval(start: dayStart, end: dayEnd)
        let weekWorkouts = sessions.filter {
            weekInterval.contains($0.startTime) && $0.category == .workout && $0.durationSeconds >= workoutQualifyingDuration
        }
        // Unique days with a workout this week
        let uniqueWorkoutDays = Set(weekWorkouts.map { calendar.startOfDay(for: $0.startTime) }).count

        // 3. Sleep Scoring (7.5 - 8.5h = 25 pts)
        let sleepDuration = durations[.sleep, default: 0]
        let sleepHours = sleepDuration / 3600.0
        let sleepPts: Double
        let sleepNote: String

        if sleepHours >= 7.5 && sleepHours <= 8.5 {
            sleepPts = 25.0
            sleepNote = "Optimal Sleep (+25 pts)"
        } else if sleepHours >= 6.0 && sleepHours < 7.5 {
            sleepPts = 15.0 + ((sleepHours - 6.0) / 1.5) * 8.0
            sleepNote = "Slightly Below Target"
        } else if sleepHours > 8.5 && sleepHours <= 10.0 {
            sleepPts = 22.0
            sleepNote = "Extended Recovery"
        } else if sleepHours > 0 {
            sleepPts = max(5.0, sleepHours * 1.5)
            sleepNote = "Deficit (<6h)"
        } else {
            sleepPts = 0.0
            sleepNote = "Not Logged Yet"
        }

        let sleepScore = PillarScore(
            pillar: .sleep,
            durationSeconds: sleepDuration,
            targetSeconds: 8.0 * 3600,
            points: min(sleepPts, 25.0),
            maxPoints: 25.0,
            isCompleted: sleepHours >= 7.0,
            statusNote: sleepNote
        )

        // 4. Family & Kid Time Scoring
        let familyDuration = durations[.family, default: 0]
        let familyTarget: TimeInterval = isWeekend ? (4.0 * 3600) : (2.0 * 3600)
        let familyMaxPts: Double = isWeekend ? 35.0 : 15.0
        let familyFraction = min(familyDuration / familyTarget, 1.0)
        let familyPts = familyFraction * familyMaxPts
        let familyScore = PillarScore(
            pillar: .family,
            durationSeconds: familyDuration,
            targetSeconds: familyTarget,
            points: familyPts,
            maxPoints: familyMaxPts,
            isCompleted: familyDuration >= (familyTarget * 0.75),
            statusNote: isWeekend ? "Family Priority" : "Evening Presence"
        )

        // 5. Drift / Social Media Leak Penalty
        let driftDuration = durations[.drift, default: 0]
        let driftPenalty: Int
        let driftNote: String

        if driftDuration <= driftGraceBuffer {
            driftPenalty = 0
            driftNote = driftDuration > 0 ? "Within 30m Grace Buffer" : "Zero Leaks"
        } else {
            let excessSeconds = driftDuration - driftGraceBuffer
            if excessSeconds <= (30.0 * 60) {
                driftPenalty = 5
            } else if excessSeconds <= (60.0 * 60) {
                driftPenalty = 10
            } else {
                driftPenalty = 20
            }
            driftNote = "-\(driftPenalty) pts penalty applied"
        }

        let driftScore = PillarScore(
            pillar: .drift,
            durationSeconds: driftDuration,
            targetSeconds: 0,
            points: Double(-driftPenalty),
            maxPoints: 0,
            isCompleted: driftDuration <= driftGraceBuffer,
            statusNote: driftNote
        )

        // 6. Routine Upkeep Gap Calculation (relative to elapsed waking time so far today)
        let wakingLoggedDuration = focusDuration + workoutDuration + familyDuration + driftDuration
        let isToday = calendar.isDateInToday(date)
        let referenceDate = isToday ? Date.now : (calendar.date(bySettingHour: 23, minute: 59, second: 59, of: date) ?? date)
        let elapsedDaySeconds = max(0, referenceDate.timeIntervalSince(calendar.startOfDay(for: date)))
        let wakingSecondsElapsed = max(0, elapsedDaySeconds - sleepDuration)
        let unloggedGap = max(0, wakingSecondsElapsed - wakingLoggedDuration)
        let isUnloggedGapHigh = wakingSecondsElapsed >= unloggedGapThreshold && unloggedGap >= unloggedGapThreshold

        // Total Alignment Score
        let rawScore = focusScore.points + workoutScore.points + sleepScore.points + familyScore.points - Double(driftPenalty)
        let totalScore = max(0, min(100, Int(round(rawScore))))

        var pillarDict: [PillarKind: PillarScore] = [:]
        pillarDict[.focusWork] = focusScore
        pillarDict[.workout] = workoutScore
        pillarDict[.sleep] = sleepScore
        pillarDict[.family] = familyScore
        pillarDict[.drift] = driftScore

        return DayResult(
            date: date,
            isWeekend: isWeekend,
            totalScore: totalScore,
            pillars: pillarDict,
            focusGatePassed: focusGatePassed,
            focusRemainingToGate: focusRemainingToGate,
            workoutCountThisWeek: uniqueWorkoutDays,
            driftPenaltyPoints: driftPenalty,
            unloggedGapSeconds: unloggedGap,
            isUnloggedGapHigh: isUnloggedGapHigh
        )
    }
}
