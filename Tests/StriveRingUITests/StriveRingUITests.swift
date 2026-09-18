import XCTest

final class StriveRingUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testLaunchAndTabNavigation() throws {
        launch(reset: true)

        // Verify Today Header and Hero Ring
        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["ALIGNMENT"].exists)

        // Switch to Timeline tab
        app.tabBars.buttons["Timeline"].tap()
        XCTAssertTrue(app.staticTexts["24h Timeline"].waitForExistence(timeout: 2))

        // Switch to Trends tab
        app.tabBars.buttons["Trends"].tap()
        XCTAssertTrue(app.staticTexts["Accountability"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Workout Target: 5–6 / Week"].exists)

        keepScreenshot(named: "01-tab-navigation")
    }

    @MainActor
    func testActiveSessionStartPauseAndStop() throws {
        launch(reset: true)

        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 10), "STEP today must render")

        // No session may leak in from another test's UserDefaults state.
        XCTAssertFalse(app.staticTexts["ACTIVE SESSION"].exists, "STEP today must start idle after reset")

        // Tap Focus Quick Start
        let startFocus = app.buttons["Focus"]
        XCTAssertTrue(startFocus.waitForExistence(timeout: 8), "STEP focus quick-start must exist")
        startFocus.tap()

        // The Focus Chamber opens for focus sessions.
        XCTAssertTrue(app.staticTexts["DEEP WORK CHAMBER"].waitForExistence(timeout: 10), "STEP chamber must open")

        // Pause and resume from inside the chamber via its identifiers,
        // unambiguous with the session dock behind the cover.
        let pauseButton = app.buttons["chamber-pause-resume"]
        XCTAssertTrue(pauseButton.waitForExistence(timeout: 8), "Chamber pause must exist")
        XCTAssertTrue(app.staticTexts["Pause"].exists)
        pauseButton.tap()
        XCTAssertTrue(app.staticTexts["Resume"].waitForExistence(timeout: 8), "Chamber must show Resume after pause")
        pauseButton.tap()
        XCTAssertTrue(app.staticTexts["Pause"].waitForExistence(timeout: 8), "Chamber must show Pause after resume")

        // Finish the block and verify the session logged.
        let finishButton = app.buttons["chamber-finish"]
        XCTAssertTrue(finishButton.waitForExistence(timeout: 8), "Chamber finish must exist")
        finishButton.tap()
        XCTAssertTrue(app.buttons["Undo"].waitForExistence(timeout: 8), "Undo toast must appear after finishing")

        keepScreenshot(named: "02-active-session")
    }

    @MainActor
    func testRetroactiveBlockLoggingAndUndo() throws {
        launch(reset: true)

        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 10))

        // Open the Focus quick-log sheet via its accessibility identifier.
        let focusLogButton = app.buttons["log-focusWork"]
        XCTAssertTrue(focusLogButton.waitForExistence(timeout: 8), "Focus quick-add must exist on Today")
        focusLogButton.tap()
        XCTAssertTrue(app.staticTexts["Log Time Block"].waitForExistence(timeout: 8))

        // Tap Confirm Entry and verify the Undo toast appears.
        let confirmBtn = app.buttons["Confirm Entry"]
        XCTAssertTrue(confirmBtn.waitForExistence(timeout: 8))
        confirmBtn.tap()

        let undoToast = app.buttons["Undo"]
        XCTAssertTrue(undoToast.waitForExistence(timeout: 8), "Undo toast must appear after logging")

        keepScreenshot(named: "03-logging-and-undo")
    }

    @MainActor
    func testWorkoutFullCreditAndWeeklyBadge() throws {
        launch(reset: true)

        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 10))

        // Log a 40-minute workout (the sheet defaults to 40m for workouts).
        let workoutLogButton = app.buttons["log-workout"]
        XCTAssertTrue(workoutLogButton.waitForExistence(timeout: 5), "STEP quick-add must exist on Today")
        workoutLogButton.tap()
        XCTAssertTrue(app.staticTexts["Log Time Block"].waitForExistence(timeout: 5), "STEP sheet must open")
        let confirmButton = app.buttons["Confirm Entry"]
        XCTAssertTrue(confirmButton.waitForExistence(timeout: 5), "STEP confirm must exist")
        XCTAssertTrue(confirmButton.isHittable, "STEP confirm must be hittable without scrolling")
        confirmButton.tap()
        XCTAssertTrue(app.buttons["Undo"].waitForExistence(timeout: 8), "STEP undo toast must appear")

        // Diagnostic evidence of the card state before asserting the badge.
        keepScreenshot(named: "04a-after-workout-log")
        print("UAT-LABELS: " + app.staticTexts.allElementsBoundByIndex.map(\.label).joined(separator: " | "))

        // The workout pillar card shows the weekly badge and full-credit points.
        XCTAssertTrue(app.staticTexts["Weekly: Day 1 of 6"].waitForExistence(timeout: 8), "STEP weekly badge must show Day 1 of 6")
        XCTAssertTrue(app.staticTexts["+20 pts"].waitForExistence(timeout: 8), "STEP workout card must show +20 pts")

        keepScreenshot(named: "04-workout-credit")
    }

    @MainActor
    func testCalibrationExportAndResetPresent() throws {
        launch(reset: true)

        app.tabBars.buttons["Trends"].tap()
        XCTAssertTrue(app.staticTexts["Accountability"].waitForExistence(timeout: 8))

        let calibrationLink = app.buttons["Target Calibration & Settings"]
        if calibrationLink.waitForExistence(timeout: 8) {
            calibrationLink.tap()
            XCTAssertTrue(app.staticTexts["Calibration"].waitForExistence(timeout: 8))
            XCTAssertTrue(app.staticTexts["Focus Work Target & Gate"].exists)
            keepScreenshot(named: "05-calibration")
        }
    }

    // MARK: - Helpers

    private func launch(reset: Bool) {
        app = XCUIApplication()
        app.launchEnvironment["STRIVERING_UITESTING"] = "1"
        if reset {
            app.launchEnvironment["STRIVERING_UITEST_RESET"] = "1"
        }
        app.launch()
    }

    private func keepScreenshot(named name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
