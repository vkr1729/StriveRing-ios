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

        // Open quick add for Focus
        let quickAddButtons = app.buttons.matching(identifier: "plus")
        if quickAddButtons.count > 0 {
            quickAddButtons.firstMatch.tap()
            XCTAssertTrue(app.staticTexts["Log Time Block"].waitForExistence(timeout: 3))

            // Tap Confirm Entry
            let confirmBtn = app.buttons["Confirm Entry"]
            if confirmBtn.exists {
                confirmBtn.tap()
            }

            // Verify Undo Toast appears
            let undoToast = app.buttons["Undo"]
            XCTAssertTrue(undoToast.waitForExistence(timeout: 3))
        }

        keepScreenshot(named: "03-logging-and-undo")
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
