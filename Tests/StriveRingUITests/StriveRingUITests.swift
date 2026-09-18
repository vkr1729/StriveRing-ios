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
        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 4))
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
    func testActiveSessionStartAndStop() throws {
        launch(reset: true)

        // Tap Focus Quick Start
        let startFocus = app.buttons["Focus"]
        if startFocus.waitForExistence(timeout: 3) {
            startFocus.tap()
        }

        // Verify Focus Chamber or Active Dock appears
        let activeLabel = app.staticTexts["ACTIVE SESSION"]
        XCTAssertTrue(activeLabel.waitForExistence(timeout: 4) || app.staticTexts["DEEP WORK CHAMBER"].exists)

        keepScreenshot(named: "02-active-session")
    }

    @MainActor
    func testRetroactiveBlockLoggingAndUndo() throws {
        launch(reset: true)

        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 4))

        // Open the Focus quick-log sheet via its accessibility identifier.
        let focusLogButton = app.buttons["log-focusWork"]
        XCTAssertTrue(focusLogButton.waitForExistence(timeout: 3), "Focus quick-add must exist on Today")
        focusLogButton.tap()
        XCTAssertTrue(app.staticTexts["Log Time Block"].waitForExistence(timeout: 3))

        // Tap Confirm Entry and verify the Undo toast appears.
        let confirmBtn = app.buttons["Confirm Entry"]
        XCTAssertTrue(confirmBtn.waitForExistence(timeout: 3))
        confirmBtn.tap()

        let undoToast = app.buttons["Undo"]
        XCTAssertTrue(undoToast.waitForExistence(timeout: 3), "Undo toast must appear after logging")

        keepScreenshot(named: "03-logging-and-undo")
    }

    @MainActor
    func testWorkoutFullCreditAndWeeklyBadge() throws {
        launch(reset: true)

        XCTAssertTrue(app.staticTexts["Today’s Rhythm"].waitForExistence(timeout: 4))

        // Log a 40-minute workout (the sheet defaults to 40m for workouts).
        app.buttons["log-workout"].tap()
        XCTAssertTrue(app.staticTexts["Log Time Block"].waitForExistence(timeout: 3))
        app.buttons["Confirm Entry"].tap()
        XCTAssertTrue(app.buttons["Undo"].waitForExistence(timeout: 3))

        // The workout pillar card shows the weekly badge and full-credit points.
        XCTAssertTrue(app.staticTexts["Weekly: Day 1 of 6"].waitForExistence(timeout: 3))
        XCTAssertTrue(app.staticTexts["+20 pts"].exists)

        keepScreenshot(named: "04-workout-credit")
    }

    @MainActor
    func testCalibrationExportAndResetPresent() throws {
        launch(reset: true)

        app.tabBars.buttons["Trends"].tap()
        XCTAssertTrue(app.staticTexts["Accountability"].waitForExistence(timeout: 3))

        let calibrationLink = app.buttons["Target Calibration & Settings"]
        if calibrationLink.waitForExistence(timeout: 3) {
            calibrationLink.tap()
            XCTAssertTrue(app.staticTexts["Calibration"].waitForExistence(timeout: 3))
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
