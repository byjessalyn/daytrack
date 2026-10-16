import WidgetKit
import SwiftUI

// Must match daytrackAppGroup in App/WidgetBridgePlugin.swift.
private let appGroup = "group.com.byjessalyn.daytrack"
private let accent = Color(hex: "#E07A5F")

// MARK: - Snapshot written by the app (src/lib/snapshot.js)

struct SnapshotItem: Codable, Hashable {
    let title: String
    let time: String
    let done: Bool
    let color: String
}
struct SnapshotDay: Codable { let date: String; let done: Int; let total: Int; let items: [SnapshotItem] }
struct SnapshotWeek: Codable { let start: String; let end: String; let done: Int; let total: Int }
struct SnapshotMonth: Codable { let month: String; let done: Int; let total: Int }
struct Snapshot: Codable {
    let version: Int
    let generatedAt: String
    let days: [SnapshotDay]
    let weeks: [SnapshotWeek]
    let months: [SnapshotMonth]

    static func load() -> Snapshot? {
        guard let json = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Snapshot.self, from: data)
    }
}

private func dayKey(_ date: Date) -> String {
    let c = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
}

// MARK: - Timeline

struct Tally {
    let done: Int
    let total: Int
    var fraction: Double { total == 0 ? 0 : Double(done) / Double(total) }
    var label: String { total == 0 ? "–" : "\(done)/\(total)" }
    var percent: String { "\(Int((fraction * 100).rounded()))%" }
}

struct DayEntry: TimelineEntry {
    let date: Date
    let day: Tally
    let week: Tally
    let month: Tally
    let items: [SnapshotItem]
    let hasSnapshot: Bool

    /// Open tasks first (in time order), then finished ones.
    var orderedItems: [SnapshotItem] { items.filter { !$0.done } + items.filter { $0.done } }
    var nextOpen: SnapshotItem? { items.first { !$0.done } }

    static func from(_ snap: Snapshot?, at date: Date) -> DayEntry {
        let key = dayKey(date)
        let d = snap?.days.first { $0.date == key }
        let w = snap?.weeks.first { $0.start <= key && key <= $0.end }
        let m = snap?.months.first { key.hasPrefix($0.month) }
        return DayEntry(
            date: date,
            day: Tally(done: d?.done ?? 0, total: d?.total ?? 0),
            week: Tally(done: w?.done ?? 0, total: w?.total ?? 0),
            month: Tally(done: m?.done ?? 0, total: m?.total ?? 0),
            items: d?.items ?? [],
            hasSnapshot: snap != nil
        )
    }

    static let sample = DayEntry(
        date: Date(),
        day: Tally(done: 2, total: 5),
        week: Tally(done: 11, total: 26),
        month: Tally(done: 38, total: 104),
        items: [
            SnapshotItem(title: "Morning workout", time: "07:00", done: true, color: "#2A9D6F"),
            SnapshotItem(title: "Team standup", time: "09:30", done: true, color: "#3D7DD8"),
            SnapshotItem(title: "Send invoice", time: "13:00", done: false, color: "#3D7DD8"),
            SnapshotItem(title: "Call mom", time: "18:00", done: false, color: "#E07A5F"),
            SnapshotItem(title: "Pay electric bill", time: "", done: false, color: "#B07CC6"),
        ],
        hasSnapshot: true
    )
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> DayEntry { .sample }

    func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
        let snap = Snapshot.load()
        completion(context.isPreview && snap == nil ? .sample : .from(snap, at: Date()))
    }

    // One entry now plus one at each of the next 7 midnights, so the widget
    // rolls over to the next day even if the app isn't opened. The app also
    // forces a reload every time the plan changes.
    func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
        let snap = Snapshot.load()
        let cal = Calendar.current
        var entries = [DayEntry.from(snap, at: Date())]
        var midnight = cal.startOfDay(for: Date())
        for _ in 0..<7 {
            guard let next = cal.date(byAdding: .day, value: 1, to: midnight) else { break }
            midnight = next
            entries.append(.from(snap, at: midnight))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - Views

struct RingView: View {
    let fraction: Double
    var lineWidth: CGFloat = 8
    var color: Color = accent

    var body: some View {
        ZStack {
            Circle().stroke(color.opacity(0.18), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: max(0.001, fraction))
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

struct TaskLine: View {
    let item: SnapshotItem
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: item.done ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color(hex: item.color))
            Text(item.title)
                .font(.system(size: 13))
                .strikethrough(item.done)
                .foregroundStyle(item.done ? .secondary : .primary)
                .lineLimit(1)
            Spacer(minLength: 4)
            if !item.time.isEmpty {
                Text(formatTime(item.time))
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct SmallView: View {
    let entry: DayEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(entry.date, format: .dateTime.weekday(.wide))
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(accent)
            ZStack {
                RingView(fraction: entry.day.fraction, lineWidth: 10)
                VStack(spacing: 0) {
                    Text(entry.day.label).font(.system(size: 20, weight: .bold)).minimumScaleFactor(0.6)
                    Text("today").font(.system(size: 10)).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            Text("Week \(entry.week.percent)")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
        }
    }
}

struct MediumView: View {
    let entry: DayEntry
    var body: some View {
        HStack(spacing: 14) {
            VStack(spacing: 6) {
                ZStack {
                    RingView(fraction: entry.day.fraction, lineWidth: 10)
                    VStack(spacing: 0) {
                        Text(entry.day.label).font(.system(size: 18, weight: .bold)).minimumScaleFactor(0.6)
                        Text("today").font(.system(size: 10)).foregroundStyle(.secondary)
                    }
                }
                Text("Week \(entry.week.percent)").font(.system(size: 11)).foregroundStyle(.secondary)
            }
            .frame(width: 96)

            VStack(alignment: .leading, spacing: 5) {
                Text(entry.date, format: .dateTime.weekday(.wide).month().day())
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(accent)
                if entry.items.isEmpty {
                    Spacer()
                    Text(entry.hasSnapshot ? "Nothing planned. Enjoy it." : "Open Daytrack to get started.")
                        .font(.system(size: 13)).foregroundStyle(.secondary)
                    Spacer()
                } else {
                    ForEach(Array(entry.orderedItems.prefix(4).enumerated()), id: \.offset) { TaskLine(item: $0.element) }
                    Spacer(minLength: 0)
                }
            }
        }
    }
}

struct LargeView: View {
    let entry: DayEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(entry.date, format: .dateTime.weekday(.wide).month().day())
                .font(.system(size: 15, weight: .bold))
            HStack(spacing: 12) {
                labeledRing("Today", entry.day)
                labeledRing("Week", entry.week)
                labeledRing("Month", entry.month)
            }
            .frame(height: 92)
            Divider()
            if entry.items.isEmpty {
                Spacer()
                Text("Nothing planned today.").font(.system(size: 14)).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                Spacer()
            } else {
                ForEach(Array(entry.orderedItems.prefix(7).enumerated()), id: \.offset) { TaskLine(item: $0.element) }
                Spacer(minLength: 0)
            }
        }
    }

    private func labeledRing(_ title: String, _ t: Tally) -> some View {
        VStack(spacing: 4) {
            ZStack {
                RingView(fraction: t.fraction, lineWidth: 7)
                Text(t.label).font(.system(size: 13, weight: .bold)).minimumScaleFactor(0.5).padding(8)
            }
            Text(title).font(.system(size: 11, weight: .medium)).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// Lock screen
struct CircularView: View {
    let entry: DayEntry
    var body: some View {
        Gauge(value: entry.day.fraction) {
            Image(systemName: "checkmark")
        } currentValueLabel: {
            Text(entry.day.total == 0 ? "–" : "\(entry.day.done)")
        }
        .gaugeStyle(.accessoryCircularCapacity)
    }
}

struct RectangularView: View {
    let entry: DayEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Today \(entry.day.label)").font(.headline)
            ProgressView(value: entry.day.fraction)
            if let next = entry.nextOpen {
                Text(next.time.isEmpty ? next.title : "\(formatTime(next.time)) \(next.title)")
                    .font(.caption).lineLimit(1)
            } else {
                Text(entry.day.total == 0 ? "Nothing planned" : "All done 🎉").font(.caption)
            }
        }
    }
}

struct DaytrackWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: DayEntry

    var body: some View {
        switch family {
        case .systemSmall: SmallView(entry: entry)
        case .systemMedium: MediumView(entry: entry)
        case .systemLarge: LargeView(entry: entry)
        case .accessoryCircular: CircularView(entry: entry)
        case .accessoryRectangular: RectangularView(entry: entry)
        case .accessoryInline: Text("\(entry.day.label) done today")
        default: SmallView(entry: entry)
        }
    }
}

struct DaytrackWidget: Widget {
    let kind = "DaytrackWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DaytrackWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Daytrack")
        .description("Today's progress and what's next.")
        .supportedFamilies([
            .systemSmall, .systemMedium, .systemLarge,
            .accessoryCircular, .accessoryRectangular, .accessoryInline,
        ])
    }
}

// MARK: - Helpers

private func formatTime(_ hhmm: String) -> String {
    let parts = hhmm.split(separator: ":").compactMap { Int($0) }
    guard parts.count == 2,
          let date = Calendar.current.date(bySettingHour: parts[0], minute: parts[1], second: 0, of: Date())
    else { return hhmm }
    return date.formatted(date: .omitted, time: .shortened)
}

extension Color {
    init(hex: String) {
        let s = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var v: UInt64 = 0
        Scanner(string: s).scanHexInt64(&v)
        self.init(
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255
        )
    }
}

#Preview(as: .systemMedium) {
    DaytrackWidget()
} timeline: {
    DayEntry.sample
}
