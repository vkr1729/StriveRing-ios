import XCTest
@testable import StriveRing

@MainActor
final class StriveRingTests: XCTestCase {

    // Fixed Wednesday for weekday testing
    private var testWeekday: Date {
        var components = DateComponents()
        components.year = 2026
        components.month = 9
        components.day = 9 // Wednesday
        components.hour = 12
        return Calendar.current.date(from: components)!
    }

    // Fixed Saturday for weekend testing
    private var testWeekend: Date {
        var components = DateComponents()
        components.year = 2026
        components.month = 9
        components.day = 12 // Saturday
        components.hour = 12
        return Calendar.current.date(from: components)!
    }

    // MARK: - 1. Focus Work Gate Tests

    func testFocusWorkBelowLockInGate() {
        // 4.0 hours on a weekday
        let session = TimeSession(
            category: .focusWork,
            startTime: testWeekday.addingTimeInterval(-4 * 3600),
            durationSeconds: 4 * 3600
        )

        let result = AlignmentEngine.calculate(sessions: [session], for: testWeekday)
        let focusScore = result.pillarScore(for: .focusWork)

        XCTAssertFalse(result.focusGatePassed, "Should not pass 6h gate with 4h logged")
        XCTAssertEqual(focusScore.points, 20.0, accuracy: 0.1, "4h should yield 20 pts (5 pts/hr)")
        XCTAssertEqual(result.focusRemainingToGate, 2 * 3600, accuracy: 1.0, "Should have 2h remaining to gate")
    }

    func testFocusWorkExactLockInGate() {
        // Exactly 6.0 hours on a weekday
        let session = TimeSession(
            category: .focusWork,
            startTime: testWeekday.addingTimeInterval(-6 * 3600),
            durationSeconds: 6 * 3600
        )

        let result = AlignmentEngine.calculate(sessions: [session], for: testWeekday)
        let focusScore = result.pillarScore(for: .focusWork)

        XCTAssertTrue(result.focusGatePassed, "Should pass 6h gate with 6h logged")
        XCTAssertEqual(focusScore.points, 30.0, accuracy: 0.1, "6h should yield 30 pts")
        XCTAssertEqual(result.focusRemainingToGate, 0, "No time remaining to gate")
    }

    func testFocusWorkFull8HourTargetAndCap() {
        // 8.0 hours
        let session8h = TimeSession(
            category: .focusWork,
            startTime: testWeekday.addingTimeInterval(-8 * 3600),
            durationSeconds: 8 * 3600
        )
        let res8h = AlignmentEngine.calculate(sessions: [session8h], for: testWeekday)
        XCTAssertEqual(res8h.pillarScore(for: .focusWork).points, 40.0, accuracy: 0.1, "8h should yield max 40 pts")

        // 12.0 hours (over-farming should be capped)
        let session12h = TimeSession(
            category: .focusWork,
            startTime: testWeekday.addingTimeInterval(-12 * 3600),
            durationSeconds: 12 * 3600
        )
        let res12h = AlignmentEngine.calculate(sessions: [session12h], for: testWeekday)
        XCTAssertEqual(res12h.pillarScore(for: .focusWork).points, 40.0, accuracy: 0.1, "Points must cap at 40 pts")
    }

    // MARK: - 2. Workout Turnaround & 40m Full Credit

    func testWorkout40MinuteFullCredit() {
        // 40 minutes (2,400s)
        let session40m = TimeSession(
            category: .workout,
            startTime: testWeekday.addingTimeInterval(-2400),
            durationSeconds: 2400
        )
        let result = AlignmentEngine.calculate(sessions: [session40m], for: testWeekday)
        let workoutScore = result.pillarScore(for: .workout)

        XCTAssertTrue(workoutScore.isCompleted, "40m workout must qualify for completion")
        XCTAssertEqual(workoutScore.points, 20.0, accuracy: 0.1, "40m workout must receive full 20 pts")
        XCTAssertEqual(result.workoutCountThisWeek, 1, "Should count 1 workout this week")
    }

    func testWorkoutUnderQualifyingThreshold() {
        // 20 minutes (1,200s) - partial credit
        let session20m = TimeSession(
            category: .workout,
            startTime: testWeekday.addingTimeInterval(-1200),
            durationSeconds: 1200
        )
        let result = AlignmentEngine.calculate(sessions: [session20m], for: testWeekday)
        let workoutScore = result.pillarScore(for: .workout)

        XCTAssertFalse(workoutScore.isCompleted)
        XCTAssertLessThan(workoutScore.points, 20.0)
    }

    // MARK: - 3. Sleep Scoring

    func testOptimalSleep() {
        let sleep7_5h = TimeSession(
            category: .sleep,
            startTime: testWeekday.addingTimeInterval(-7.5 * 3600),
            durationSeconds: 7.5 * 3600
        )
        let result = AlignmentEngine.calculate(sessions: [sleep7_5h], for: testWeekday)
        XCTAssertEqual(result.pillarScore(for: .sleep).points, 25.0, accuracy: 0.1, "7.5h sleep must award 25 pts")
    }

    func testDeficitSleep() {
        let sleep5h = TimeSession(
            category: .sleep,
            startTime: testWeekday.addingTimeInterval(-5.0 * 3600),
            durationSeconds: 5.0 * 3600
        )
        let result = AlignmentEngine.calculate(sessions: [sleep5h], for: testWeekday)
        XCTAssertLessThanOrEqual(result.pillarScore(for: .sleep).points, 10.0, "Deficit sleep must be penalized")
    }

    // MARK: - 4. Drift Buffer & Tiered Penalties

    func testDriftWithin30MinuteGraceBuffer() {
        // 25 minutes YouTube
        let drift25m = TimeSession(
            category: .drift,
            startTime: testWeekday.addingTimeInterval(-1500),
            durationSeconds: 1500
        )
        let result = AlignmentEngine.calculate(sessions: [drift25m], for: testWeekday)

        XCTAssertEqual(result.driftPenaltyPoints, 0, "0 to 30m drift must have 0 penalty")
    }

    func testDriftTieredPenalties() {
        // 45 minutes (-5 pts)
        let drift45m = TimeSession(
            category: .drift,
            startTime: testWeekday.addingTimeInterval(-2700),
            durationSeconds: 2700
        )
        let res45 = AlignmentEngine.calculate(sessions: [drift45m], for: testWeekday)
        XCTAssertEqual(res45.driftPenaltyPoints, 5, "45m drift must deduct 5 pts")

        // 80 minutes (-10 pts)
        let drift80m = TimeSession(
            category: .drift,
            startTime: testWeekday.addingTimeInterval(-4800),
            durationSeconds: 4800
        )
        let res80 = AlignmentEngine.calculate(sessions: [drift80m], for: testWeekday)
        XCTAssertEqual(res80.driftPenaltyPoints, 10, "80m drift must deduct 10 pts")

        // 120 minutes (-20 pts max cap)
        let drift120m = TimeSession(
            category: .drift,
            startTime: testWeekday.addingTimeInterval(-7200),
            durationSeconds: 7200
        )
        let res120 = AlignmentEngine.calculate(sessions: [drift120m], for: testWeekday)
        XCTAssertEqual(res120.driftPenaltyPoints, 20, "120m drift must cap at -20 pts penalty")
    }

    // MARK: - 5. Weekend Dynamic Shift

    func testWeekendFocusOptionalAndFamilyPriority() {
        // Weekend with 4h Family and 0h Focus
        let family4h = TimeSession(
            category: .family,
            startTime: testWeekend.addingTimeInterval(-4 * 3600),
            durationSeconds: 4 * 3600
        )
        let sleep8h = TimeSession(
            category: .sleep,
            startTime: testWeekend.addingTimeInterval(-8 * 3600),
            durationSeconds: 8 * 3600
        )
        let workout40m = TimeSession(
            category: .workout,
            startTime: testWeekend.addingTimeInterval(-2400),
            durationSeconds: 2400
        )

        let result = AlignmentEngine.calculate(sessions: [family4h, sleep8h, workout40m], for: testWeekend)

        XCTAssertTrue(result.isWeekend)
        XCTAssertTrue(result.focusGatePassed, "Weekend focus gate should be automatically satisfied")
        XCTAssertEqual(result.pillarScore(for: .family).points, 35.0, accuracy: 0.1, "Weekend family must award 35 pts")
        XCTAssertEqual(result.totalScore, 80, "Sleep (25) + Workout (20) + Family (35) = 80 pts without mandatory focus")
    }

    // MARK: - 6. Total Alignment Clamping

    func testScoreClampedTo100Max() {
        let focus8h = TimeSession(category: .focusWork, startTime: testWeekday, durationSeconds: 8 * 3600)
        let sleep8h = TimeSession(category: .sleep, startTime: testWeekday, durationSeconds: 8 * 3600)
        let workout60m = TimeSession(category: .workout, startTime: testWeekday, durationSeconds: 3600)
        let family2h = TimeSession(category: .family, startTime: testWeekday, durationSeconds: 2 * 3600)

        let result = AlignmentEngine.calculate(sessions: [focus8h, sleep8h, workout60m, family2h], for: testWeekday)
        XCTAssertEqual(result.totalScore, 100, "Perfect day must equal 100 points exactly")
    }

    // MARK: - 7. SessionManager Live Timer Reactivity

    func testSessionManagerLiveTicking() {
        let manager = SessionManager.shared
        manager.startSession(category: .focusWork)
        XCTAssertTrue(manager.isRunning)
        XCTAssertEqual(manager.activeCategory, .focusWork)
        XCTAssertEqual(manager.formattedElapsed, "00:00:00")

        // Simulate tick
        manager.liveElapsedSeconds = 65
        XCTAssertEqual(manager.formattedElapsed, "00:01:05", "Observation property must format elapsed time")

        _ = manager.stopSession()
        XCTAssertFalse(manager.isRunning)
        XCTAssertEqual(manager.liveElapsedSeconds, 0)
    }

    // MARK: - 8. Unlogged Gap Upkeep Logic

    func testUnloggedGapPastDayCalculation() {
        // Historical day where only 1h was logged, sleep was 8h (15h waking unlogged > 5h)
        let focus1h = TimeSession(category: .focusWork, startTime: testWeekday, durationSeconds: 3600)
        let sleep8h = TimeSession(category: .sleep, startTime: testWeekday, durationSeconds: 8 * 3600)

        let result = AlignmentEngine.calculate(sessions: [focus1h, sleep8h], for: testWeekday)
        XCTAssertTrue(result.isUnloggedGapHigh, "Historical day with 15h unlogged gap must flag as high")
    }
}
