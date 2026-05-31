import Foundation
import ActivityKit
import WidgetKit

@objc(StriveRingActivityBridge)
class StriveRingActivityBridge: NSObject {
    private var currentActivity: Any? = nil // Stored as Any to avoid compilation issues in non-iOS environments if needed
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc func syncSharedState(_ dailyStrain: Int, target: Int, completedSessionsJson: String) {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.strivering.app") else {
            return
        }
        let payload: [String: Any] = [
            "dailyStrain": dailyStrain,
            "target": target,
            "completedSessionsJson": completedSessionsJson,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: payload) {
            sharedDefaults.set(data, forKey: "widgetPayload")
        }
        // Legacy keys preserved for any older widget builds
        sharedDefaults.set(dailyStrain, forKey: "dailyStrain")
        sharedDefaults.set(target, forKey: "target")
        sharedDefaults.set(completedSessionsJson, forKey: "completedSessionsJson")
        
        // Reload widgets
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
    
    @objc func startActivity(_ habitId: String, habitName: String, totalScore: Int, target: Int, elapsedMs: Double) {
        guard #available(iOS 16.1, *) else { return }
        
        // End any active sessions first
        endActivityInternal()
        
        let attributes = StriveRingAttributes(habitId: habitId)
        let initialContentState = StriveRingAttributes.ContentState(
            liveScore: 0,
            totalScore: totalScore,
            target: target,
            habitName: habitName,
            elapsedMs: elapsedMs
        )
        
        do {
            let activity = try Activity<StriveRingAttributes>.request(
                attributes: attributes,
                contentState: initialContentState,
                pushType: nil
            )
            self.currentActivity = activity
            print("Successfully started Live Activity: \(activity.id)")
        } catch {
            print("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }
    
    @objc func updateActivity(_ liveScore: Int, totalScore: Int, elapsedMs: Double) {
        guard #available(iOS 16.1, *) else { return }
        
        guard let activity = currentActivity as? Activity<StriveRingAttributes> else {
            // Try to find any active StriveRingAttributes activity
            if let existingActivity = Activity<StriveRingAttributes>.activities.first {
                self.currentActivity = existingActivity
                updateActivity(liveScore, totalScore: totalScore, elapsedMs: elapsedMs)
            }
            return
        }
        
        let updatedState = StriveRingAttributes.ContentState(
            liveScore: liveScore,
            totalScore: totalScore,
            target: activity.contentState.target,
            habitName: activity.contentState.habitName,
            elapsedMs: elapsedMs
        )
        
        Task {
            await activity.update(using: updatedState)
            print("Updated Live Activity: \(activity.id)")
        }
    }
    
    @objc func endActivity(_ liveScore: Int, totalScore: Int, elapsedMs: Double) {
        endActivityInternal(liveScore: liveScore, totalScore: totalScore, elapsedMs: elapsedMs)
    }
    
    private func endActivityInternal(liveScore: Int? = nil, totalScore: Int? = nil, elapsedMs: Double? = nil) {
        guard #available(iOS 16.1, *) else { return }
        
        let activities = Activity<StriveRingAttributes>.activities
        for activity in activities {
            let finalState: StriveRingAttributes.ContentState
            if let liveScore = liveScore, let totalScore = totalScore, let elapsedMs = elapsedMs {
                finalState = StriveRingAttributes.ContentState(
                    liveScore: liveScore,
                    totalScore: totalScore,
                    target: activity.contentState.target,
                    habitName: activity.contentState.habitName,
                    elapsedMs: elapsedMs
                )
            } else {
                finalState = activity.contentState
            }
            
            Task {
                await activity.end(using: finalState, dismissalPolicy: .immediate)
            }
        }
        self.currentActivity = nil
    }
}

// ActivityAttributes structure required by StriveRingActivityBridge
public struct StriveRingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var liveScore: Int
        public var totalScore: Int
        public var target: Int
        public var habitName: String
        public var elapsedMs: Double

        public init(liveScore: Int, totalScore: Int, target: Int, habitName: String, elapsedMs: Double) {
            self.liveScore = liveScore
            self.totalScore = totalScore
            self.target = target
            self.habitName = habitName
            self.elapsedMs = elapsedMs
        }
    }

    public var habitId: String

    public init(habitId: String) {
        self.habitId = habitId
    }
}
