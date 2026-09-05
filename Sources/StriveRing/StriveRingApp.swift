import SwiftData
import SwiftUI

@main
struct StriveRingApp: App {
    private let container: ModelContainer = {
        do {
            let environment = ProcessInfo.processInfo.environment
            let isUITesting = environment["STRIVERING_UITESTING"] == "1"
            let isUnitTesting = environment["XCTestConfigurationFilePath"] != nil && !isUITesting
            let configuration = ModelConfiguration(isStoredInMemoryOnly: isUnitTesting || isUITesting)
            return try ModelContainer(for: TimeSession.self, configurations: configuration)
        } catch {
            fatalError("Unable to create StriveRing's local store: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.light)
        }
        .modelContainer(container)
    }
}

struct RootView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var hasSeeded = false

    var body: some View {
        TabView {
            Tab("Today", systemImage: "circle.circle") {
                NavigationStack { TodayView() }
            }

            Tab("Timeline", systemImage: "clock.arrow.circlepath") {
                NavigationStack { TimelineView() }
            }

            Tab("Trends", systemImage: "chart.bar.xaxis") {
                NavigationStack { TrendsView() }
            }
        }
        .tint(Color.srBrand)
        .task {
            guard !hasSeeded else { return }
            hasSeeded = true

            // Clean reset if requested by automated tests
            if ProcessInfo.processInfo.environment["STRIVERING_UITEST_RESET"] == "1" {
                let storedSessions = (try? modelContext.fetch(FetchDescriptor<TimeSession>())) ?? []
                storedSessions.forEach(modelContext.delete)
                try? modelContext.save()
            }
        }
    }
}
