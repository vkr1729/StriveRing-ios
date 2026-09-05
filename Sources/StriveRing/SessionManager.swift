import Foundation
import SwiftUI

@Observable
final class SessionManager {
    static let shared = SessionManager()

    var activeCategory: PillarKind?
    var startTime: Date?
    var accumulatedSeconds: TimeInterval = 0
    var isPaused: Bool = false
    var sessionNote: String?
    var isShowingRunawayPrompt: Bool = false

    private var timer: Timer?

    private let userDefaultsCategoryKey = "StriveRing_ActiveCategory"
    private let userDefaultsStartTimeKey = "StriveRing_StartTime"
    private let userDefaultsAccumulatedKey = "StriveRing_Accumulated"
    private let userDefaultsIsPausedKey = "StriveRing_IsPaused"
    private let userDefaultsNoteKey = "StriveRing_Note"

    init() {
        restoreState()
    }

    var isRunning: Bool {
        activeCategory != nil
    }

    var elapsedSeconds: TimeInterval {
        guard let startTime, activeCategory != nil else { return accumulatedSeconds }
        if isPaused {
            return accumulatedSeconds
        } else {
            return accumulatedSeconds + max(0, Date.now.timeIntervalSince(startTime))
        }
    }

    var formattedElapsed: String {
        let total = Int(elapsedSeconds)
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        let seconds = total % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }

    func startSession(category: PillarKind, note: String? = nil) {
        // If already running another session, stop it first or ignore
        self.activeCategory = category
        self.startTime = .now
        self.accumulatedSeconds = 0
        self.isPaused = false
        self.sessionNote = note
        self.isShowingRunawayPrompt = false

        persistState()
        startTimer()
    }

    func pauseSession() {
        guard !isPaused, let startTime else { return }
        accumulatedSeconds += max(0, Date.now.timeIntervalSince(startTime))
        self.startTime = nil
        self.isPaused = true

        persistState()
        stopTimer()
    }

    func resumeSession() {
        guard isPaused else { return }
        self.startTime = .now
        self.isPaused = false

        persistState()
        startTimer()
    }

    func stopSession() -> TimeSession? {
        guard let category = activeCategory else { return nil }
        let totalDuration = elapsedSeconds

        let session = TimeSession(
            category: category,
            startTime: (startTime ?? .now).addingTimeInterval(-totalDuration),
            endTime: .now,
            durationSeconds: totalDuration,
            note: sessionNote
        )

        clearState()
        return session
    }

    func trimSession(to newDurationSeconds: TimeInterval) -> TimeSession? {
        guard let category = activeCategory else { return nil }

        let session = TimeSession(
            category: category,
            startTime: Date.now.addingTimeInterval(-newDurationSeconds),
            endTime: .now,
            durationSeconds: newDurationSeconds,
            note: sessionNote
        )

        clearState()
        return session
    }

    func cancelSession() {
        clearState()
    }

    func checkRunawaySession() {
        guard let category = activeCategory, !isPaused else { return }
        // Sleep naturally runs 8h+, do not prompt for sleep
        guard category != .sleep else { return }

        // If daytime focus or workout exceeds 4 hours continuously
        if elapsedSeconds >= (4.0 * 3600) {
            isShowingRunawayPrompt = true
        }
    }

    // MARK: - Internal Timer

    private func startTimer() {
        stopTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            // Force state update for SwiftUI observers
            if self.activeCategory != nil && !self.isPaused {
                self.checkRunawaySession()
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - State Persistence

    private func persistState() {
        let defaults = UserDefaults.standard
        if let category = activeCategory {
            defaults.set(category.rawValue, forKey: userDefaultsCategoryKey)
            defaults.set(startTime?.timeIntervalSince1970, forKey: userDefaultsStartTimeKey)
            defaults.set(accumulatedSeconds, forKey: userDefaultsAccumulatedKey)
            defaults.set(isPaused, forKey: userDefaultsIsPausedKey)
            defaults.set(sessionNote, forKey: userDefaultsNoteKey)
        } else {
            defaults.removeObject(forKey: userDefaultsCategoryKey)
            defaults.removeObject(forKey: userDefaultsStartTimeKey)
            defaults.removeObject(forKey: userDefaultsAccumulatedKey)
            defaults.removeObject(forKey: userDefaultsIsPausedKey)
            defaults.removeObject(forKey: userDefaultsNoteKey)
        }
    }

    private func restoreState() {
        let defaults = UserDefaults.standard
        guard let rawCategory = defaults.string(forKey: userDefaultsCategoryKey),
              let category = PillarKind(rawValue: rawCategory) else {
            return
        }

        self.activeCategory = category
        self.isPaused = defaults.bool(forKey: userDefaultsIsPausedKey)
        self.accumulatedSeconds = defaults.double(forKey: userDefaultsAccumulatedKey)
        self.sessionNote = defaults.string(forKey: userDefaultsNoteKey)

        let startTimestamp = defaults.double(forKey: userDefaultsStartTimeKey)
        if startTimestamp > 0 && !isPaused {
            self.startTime = Date(timeIntervalSince1970: startTimestamp)
            startTimer()
        }

        checkRunawaySession()
    }

    private func clearState() {
        stopTimer()
        self.activeCategory = nil
        self.startTime = nil
        self.accumulatedSeconds = 0
        self.isPaused = false
        self.sessionNote = nil
        self.isShowingRunawayPrompt = false
        persistState()
    }
}
