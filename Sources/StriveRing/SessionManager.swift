import Foundation
import SwiftUI

@MainActor
@Observable
final class SessionManager {
    static let shared = SessionManager()

    var activeCategory: PillarKind?
    var startTime: Date?
    var sessionStartDate: Date?
    var accumulatedSeconds: TimeInterval = 0
    var isPaused: Bool = false
    var sessionNote: String?
    var isShowingRunawayPrompt: Bool = false
    var liveElapsedSeconds: TimeInterval = 0

    private var timer: Timer?

    private let userDefaultsCategoryKey = "StriveRing_ActiveCategory"
    private let userDefaultsStartTimeKey = "StriveRing_StartTime"
    private let userDefaultsSessionStartKey = "StriveRing_SessionStart"
    private let userDefaultsAccumulatedKey = "StriveRing_Accumulated"
    private let userDefaultsIsPausedKey = "StriveRing_IsPaused"
    private let userDefaultsNoteKey = "StriveRing_Note"

    init() {
        // UI tests reset SwiftData but share the simulator's UserDefaults across
        // launches; a session left running by one test would otherwise leak into
        // the next. Start clean when a test reset is requested.
        if ProcessInfo.processInfo.environment["STRIVERING_UITEST_RESET"] == "1" {
            clearPersistedState()
            return
        }
        restoreState()
    }

    var isRunning: Bool {
        activeCategory != nil
    }

    var elapsedSeconds: TimeInterval {
        _ = liveElapsedSeconds
        guard let startTime, activeCategory != nil else { return accumulatedSeconds }
        if isPaused {
            return accumulatedSeconds
        } else {
            return accumulatedSeconds + max(0, Date.now.timeIntervalSince(startTime))
        }
    }

    var formattedElapsed: String {
        _ = liveElapsedSeconds
        let total = Int(liveElapsedSeconds > 0 ? liveElapsedSeconds : elapsedSeconds)
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        let seconds = total % 60
        return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
    }

    @discardableResult
    func startSession(category: PillarKind, note: String? = nil) -> TimeSession? {
        // Preserve any in-flight session instead of silently discarding it.
        let orphaned = activeCategory != nil ? stopSession() : nil
        self.activeCategory = category
        let now = Date.now
        self.startTime = now
        self.sessionStartDate = now
        self.accumulatedSeconds = 0
        self.isPaused = false
        self.sessionNote = note
        self.isShowingRunawayPrompt = false

        persistState()
        startTimer()
        return orphaned
    }

    func pauseSession() {
        guard !isPaused, let startTime else { return }
        accumulatedSeconds += max(0, Date.now.timeIntervalSince(startTime))
        if sessionStartDate == nil {
            sessionStartDate = startTime.addingTimeInterval(-accumulatedSeconds)
        }
        self.startTime = nil
        self.isPaused = true
        self.liveElapsedSeconds = accumulatedSeconds

        persistState()
        stopTimer()
    }

    func resumeSession() {
        guard isPaused else { return }
        self.startTime = .now
        self.isPaused = false
        self.liveElapsedSeconds = accumulatedSeconds

        persistState()
        startTimer()
    }

    func stopSession() -> TimeSession? {
        guard let category = activeCategory else { return nil }
        let totalDuration = elapsedSeconds
        let endDate = Date.now

        let session = TimeSession(
            category: category,
            startTime: sessionStartDate ?? endDate.addingTimeInterval(-totalDuration),
            endTime: endDate,
            durationSeconds: totalDuration,
            note: sessionNote
        )

        clearState()
        return session
    }

    func trimSession(to newDurationSeconds: TimeInterval) -> TimeSession? {
        guard let category = activeCategory else { return nil }

        let endDate = Date.now
        let earliestStart = sessionStartDate ?? endDate.addingTimeInterval(-elapsedSeconds)
        let requestedStart = endDate.addingTimeInterval(-newDurationSeconds)
        let trimmedStart = max(earliestStart, requestedStart)

        let session = TimeSession(
            category: category,
            startTime: trimmedStart,
            endTime: endDate,
            durationSeconds: endDate.timeIntervalSince(trimmedStart),
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
        self.liveElapsedSeconds = self.elapsedSeconds
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                if self.activeCategory != nil && !self.isPaused {
                    self.liveElapsedSeconds = self.elapsedSeconds
                    self.checkRunawaySession()
                }
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
            defaults.set(sessionStartDate?.timeIntervalSince1970, forKey: userDefaultsSessionStartKey)
            defaults.set(accumulatedSeconds, forKey: userDefaultsAccumulatedKey)
            defaults.set(isPaused, forKey: userDefaultsIsPausedKey)
            defaults.set(sessionNote, forKey: userDefaultsNoteKey)
        } else {
            defaults.removeObject(forKey: userDefaultsCategoryKey)
            defaults.removeObject(forKey: userDefaultsStartTimeKey)
            defaults.removeObject(forKey: userDefaultsSessionStartKey)
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

        let sessionStartTimestamp = defaults.double(forKey: userDefaultsSessionStartKey)
        self.sessionStartDate = sessionStartTimestamp > 0 ? Date(timeIntervalSince1970: sessionStartTimestamp) : nil

        let startTimestamp = defaults.double(forKey: userDefaultsStartTimeKey)
        if startTimestamp > 0 && !isPaused {
            self.startTime = Date(timeIntervalSince1970: startTimestamp)
            self.liveElapsedSeconds = self.elapsedSeconds
            startTimer()
        } else {
            self.liveElapsedSeconds = self.accumulatedSeconds
        }

        checkRunawaySession()
    }

    private func clearPersistedState() {
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: userDefaultsCategoryKey)
        defaults.removeObject(forKey: userDefaultsStartTimeKey)
        defaults.removeObject(forKey: userDefaultsSessionStartKey)
        defaults.removeObject(forKey: userDefaultsAccumulatedKey)
        defaults.removeObject(forKey: userDefaultsIsPausedKey)
        defaults.removeObject(forKey: userDefaultsNoteKey)
    }

    private func clearState() {
        stopTimer()
        self.activeCategory = nil
        self.startTime = nil
        self.sessionStartDate = nil
        self.accumulatedSeconds = 0
        self.isPaused = false
        self.sessionNote = nil
        self.isShowingRunawayPrompt = false
        self.liveElapsedSeconds = 0
        persistState()
    }
}
