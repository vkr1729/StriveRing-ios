import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), dailyStrain: 45, target: 100, completedSessions: [
            CompletedSessionWidgetModel(name: "Focus Work", score: 24, colorHex: "#00e5a0"),
            CompletedSessionWidgetModel(name: "Sleep", score: 20, colorHex: "#a78bfa")
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = readSharedDefaultsEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = readSharedDefaultsEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func readSharedDefaultsEntry() -> SimpleEntry {
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.strivering.app") else {
            return SimpleEntry(date: Date(), dailyStrain: 0, target: 100, completedSessions: [])
        }

        // Prefer atomic blob to avoid partial reads
        if let payloadData = sharedDefaults.data(forKey: "widgetPayload"),
           let payload = try? JSONSerialization.jsonObject(with: payloadData) as? [String: Any] {
            let dailyStrain = payload["dailyStrain"] as? Int ?? 0
            let target = (payload["target"] as? Int).map { $0 > 0 ? $0 : 100 } ?? 100
            let jsonString = payload["completedSessionsJson"] as? String ?? ""

            var completedSessions: [CompletedSessionWidgetModel] = []
            if let data = jsonString.data(using: .utf8) {
                do {
                    completedSessions = try JSONDecoder().decode([CompletedSessionWidgetModel].self, from: data)
                } catch {
                    print("Failed to decode completed sessions: \(error)")
                }
            }
            return SimpleEntry(date: Date(), dailyStrain: dailyStrain, target: target, completedSessions: completedSessions)
        }

        // Fallback to legacy individual keys
        let dailyStrain = sharedDefaults.integer(forKey: "dailyStrain")
        let rawTarget = sharedDefaults.integer(forKey: "target")
        let target = rawTarget > 0 ? rawTarget : 100

        var completedSessions: [CompletedSessionWidgetModel] = []
        if let jsonString = sharedDefaults.string(forKey: "completedSessionsJson"),
           let data = jsonString.data(using: .utf8) {
            do {
                completedSessions = try JSONDecoder().decode([CompletedSessionWidgetModel].self, from: data)
            } catch {
                print("Failed to decode completed sessions: \(error)")
            }
        }

        return SimpleEntry(date: Date(), dailyStrain: dailyStrain, target: target, completedSessions: completedSessions)
    }
}

struct CompletedSessionWidgetModel: Codable, Identifiable {
    var id: String { name + "\(score)" + colorHex }
    let name: String
    let score: Int
    let colorHex: String
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let dailyStrain: Int
    let target: Int
    let completedSessions: [CompletedSessionWidgetModel]
}

struct StriveRingWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Small Widget View
struct SmallWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.1), lineWidth: 8)
                
                Circle()
                    .trim(from: 0, to: CGFloat(min(Double(entry.dailyStrain) / Double(entry.target), 1.0)))
                    .stroke(
                        LinearGradient(
                            colors: [Color(hex: "#00e5a0"), Color(hex: "#a78bfa")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                
                Text("\(entry.dailyStrain)")
                    .font(.system(.title2, design: .serif))
                    .bold()
                    .foregroundColor(.white)
            }
            .frame(width: 76, height: 76)
            
            Text("Strive Ring")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(.white.opacity(0.6))
        }
        .modifier(ContainerBackgroundCompat(color: Color(hex: "#060a10")))
    }
}

// MARK: - Medium Widget View
struct MediumWidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        HStack(spacing: 24) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 6)
                    Circle()
                        .trim(from: 0, to: CGFloat(min(Double(entry.dailyStrain) / Double(entry.target), 1.0)))
                        .stroke(
                            LinearGradient(
                                colors: [Color(hex: "#00e5a0"), Color(hex: "#a78bfa")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                    
                    Text("\(entry.dailyStrain)")
                        .font(.system(.headline, design: .serif))
                        .bold()
                        .foregroundColor(.white)
                }
                .frame(width: 58, height: 58)
                
                Text("Daily Strain")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(.white.opacity(0.5))
            }
            
            VStack(alignment: .leading, spacing: 5) {
                Text("COMPLETED ACTIVITIES")
                    .font(.system(size: 9, weight: .black))
                    .foregroundColor(.white.opacity(0.4))
                    .tracking(1.0)
                
                if entry.completedSessions.isEmpty {
                    Text("No activities completed yet.")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.4))
                        .italic()
                        .padding(.top, 4)
                } else {
                    VStack(spacing: 4) {
                        ForEach(entry.completedSessions.prefix(3)) { session in
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(Color(hex: session.colorHex))
                                    .frame(width: 6, height: 6)
                                Text(session.name)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(.white.opacity(0.9))
                                    .lineLimit(1)
                                Spacer()
                                Text("+\(session.score) pts")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(Color(hex: "#00e5a0"))
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.04))
                            .cornerRadius(6)
                        }
                    }
                }
                Spacer()
            }
            .padding(.top, 2)
        }
        .modifier(ContainerBackgroundCompat(color: Color(hex: "#060a10")))
    }
}

struct StriveRingWidget: Widget {
    let kind: String = "StriveRingWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            StriveRingWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("StriveRing")
        .description("Tracks your daily wellness progress rings and habits.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct ContainerBackgroundCompat: ViewModifier {
    let color: Color

    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.containerBackground(color, for: .widget)
        } else {
            content.background(color)
        }
    }
}
