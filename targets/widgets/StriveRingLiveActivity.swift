import ActivityKit
import WidgetKit
import SwiftUI

public struct StriveRingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic values that update in real-time
        public var liveScore: Int
        public var totalScore: Int
        public var target: Int
        public var habitName: String
        public var elapsedMs: Double
    }

    // Static variables
    public var habitId: String
}

@main
struct StriveRingWidgetBundle: WidgetBundle {
    var body: some Widget {
        StriveRingWidget()
        StriveRingLiveActivity()
    }
}

struct StriveRingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StriveRingAttributes.self) { context in
            // Lock Screen UI / Banner UI when Dynamic Island is not available
            HStack(spacing: 16) {
                // Glow Circle
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 4)
                        .frame(width: 48, height: 48)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(Double(context.state.totalScore + context.state.liveScore) / Double(context.state.target), 1.0)))
                        .stroke(Color(hex: "#00e5a0"), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .frame(width: 48, height: 48)
                    
                    Text("\(context.state.totalScore + context.state.liveScore)")
                        .font(.system(.subheadline, design: .serif))
                        .bold()
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(hex: "#a78bfa"))
                            .frame(width: 8, height: 8)
                        Text(context.state.habitName.uppercased())
                            .font(.system(.caption, design: .default))
                            .bold()
                            .foregroundColor(Color(hex: "#a78bfa"))
                    }
                    
                    Text("Live Score: \(context.state.liveScore) pts")
                        .font(.system(.footnote, design: .default))
                        .foregroundColor(.white.opacity(0.8))
                }
                
                Spacer()
                
                // Active monospaced stopwatch
                Text(Date(timeIntervalSinceNow: -context.state.elapsedMs / 1000.0), style: .timer)
                    .font(.system(.headline, design: .monospaced))
                    .foregroundColor(Color(hex: "#00e5a0"))
                    .frame(width: 90, alignment: .trailing)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(Color(hex: "#060a10").opacity(0.95))
            .activityBackgroundTint(Color.black.opacity(0.6))
            .activitySystemActionForegroundColor(Color.white)
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded View (Long Press on Island)
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(Color(hex: "#00e5a0"))
                            .frame(width: 8, height: 8)
                        Text(context.state.habitName.uppercased())
                            .font(.system(.headline, design: .default))
                            .bold()
                            .foregroundColor(Color(hex: "#00e5a0"))
                    }
                    .padding(.leading, 8)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(Date(timeIntervalSinceNow: -context.state.elapsedMs / 1000.0), style: .timer)
                        .font(.system(.headline, design: .monospaced))
                        .foregroundColor(Color(hex: "#00e5a0"))
                        .padding(.trailing, 8)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Live Score: \(context.state.liveScore) pts  •  Total Score: \(context.state.totalScore + context.state.liveScore)")
                            .font(.system(.footnote, design: .default))
                            .foregroundColor(.white.opacity(0.8))
                        
                        // Progress bar track
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.white.opacity(0.1))
                                    .frame(height: 6)
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color(hex: "#00e5a0"))
                                    .frame(width: geometry.size.width * CGFloat(min(Double(context.state.totalScore + context.state.liveScore) / Double(context.state.target), 1.0)), height: 6)
                            }
                        }
                        .frame(height: 6)
                    }
                    .padding(.horizontal, 8)
                    .padding(.bottom, 6)
                }
            } compactLeading: {
                // Compact Left
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color(hex: "#00e5a0"))
                        .frame(width: 8, height: 8)
                    Text(context.state.habitName)
                        .font(.system(.caption, design: .default))
                        .foregroundColor(Color(hex: "#00e5a0"))
                }
            } compactTrailing: {
                // Compact Right
                Text(Date(timeIntervalSinceNow: -context.state.elapsedMs / 1000.0), style: .timer)
                    .font(.system(.caption, design: .monospaced))
                    .foregroundColor(Color(hex: "#00e5a0"))
                    .frame(width: 50, alignment: .trailing)
            } minimal: {
                // Minimalist glowing ring score
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 2)
                        .frame(width: 26, height: 26)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(Double(context.state.totalScore + context.state.liveScore) / Double(context.state.target), 1.0)))
                        .stroke(Color(hex: "#00e5a0"), lineWidth: 2)
                        .frame(width: 26, height: 26)
                    
                    Text("\(context.state.totalScore + context.state.liveScore)")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
    }
}

// SwiftUI Color extension for clean HEX string rendering
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
