import Foundation
import WatchConnectivity
import HealthKit
import Combine

struct ExerciseState: Equatable {
    var sessionId: String = ""
    var exerciseName: String = ""
    var setNumber: Int = 0
    var totalSets: Int = 0
    var reps: Int = 0
    var loadKg: Double? = nil
    var phase: Phase = .idle
    var restSeconds: Int = 60

    enum Phase { case idle, active, resting }
}

final class WorkoutManager: NSObject, ObservableObject {
    @Published var exerciseState = ExerciseState()
    @Published var heartRate: Double = 0
    @Published var isSessionActive = false

    private let healthStore = HKHealthStore()
    private var heartRateQuery: HKAnchoredObjectQuery?
    private var pendingHRSamples: [(timestamp: Date, bpm: Int)] = []
    private var flushTimer: Timer?

    override init() {
        super.init()
        setupWatchConnectivity()
    }

    // MARK: WatchConnectivity

    private func setupWatchConnectivity() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    // MARK: HealthKit

    func requestHealthKitPermission() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        healthStore.requestAuthorization(toShare: nil, read: [hrType]) { granted, _ in
            if granted { self.startHeartRateMonitoring() }
        }
    }

    private func startHeartRateMonitoring() {
        let hrType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let query = HKAnchoredObjectQuery(
            type: hrType,
            predicate: nil,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] _, samples, _, _, _ in
            self?.process(samples: samples)
        }
        query.updateHandler = { [weak self] _, samples, _, _, _ in
            self?.process(samples: samples)
        }
        heartRateQuery = query
        healthStore.execute(query)

        // Flush HR batch to phone every 5 seconds
        flushTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            self?.flushHRSamples()
        }
    }

    private func process(samples: [HKSample]?) {
        guard let samples = samples as? [HKQuantitySample] else { return }
        let unit = HKUnit.count().unitDivided(by: .minute())
        for sample in samples {
            let bpm = Int(sample.quantity.doubleValue(for: unit))
            DispatchQueue.main.async {
                self.heartRate = Double(bpm)
            }
            pendingHRSamples.append((timestamp: sample.startDate, bpm: bpm))
        }
    }

    private func flushHRSamples() {
        guard !pendingHRSamples.isEmpty, WCSession.default.isReachable else { return }
        let formatter = ISO8601DateFormatter()
        let payload: [[String: Any]] = pendingHRSamples.map {
            ["timestamp": formatter.string(from: $0.timestamp), "bpm": $0.bpm]
        }
        pendingHRSamples.removeAll()
        WCSession.default.transferUserInfo(["type": "hr_batch", "samples": payload])
    }

    func stopSession() {
        heartRateQuery.map { healthStore.stop($0) }
        flushTimer?.invalidate()
        flushHRSamples() // final flush
        isSessionActive = false
        exerciseState = ExerciseState()
        WKInterfaceDevice.current().play(.success)
    }
}

// MARK: WCSessionDelegate

extension WorkoutManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {}

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async { self.handleMessage(message) }
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        DispatchQueue.main.async { self.handleMessage(userInfo) }
    }

    private func handleMessage(_ msg: [String: Any]) {
        guard let type = msg["type"] as? String else { return }

        switch type {
        case "exercise":
            var state = ExerciseState()
            state.sessionId = msg["sessionId"] as? String ?? ""
            state.exerciseName = msg["exerciseName"] as? String ?? ""
            state.setNumber = msg["setNumber"] as? Int ?? 0
            state.totalSets = msg["totalSets"] as? Int ?? 0
            state.reps = msg["reps"] as? Int ?? 0
            state.loadKg = msg["loadKg"] as? Double
            state.restSeconds = msg["restSeconds"] as? Int ?? 60
            let phaseStr = msg["phase"] as? String ?? "active"
            state.phase = phaseStr == "resting" ? .resting : .active
            exerciseState = state
            isSessionActive = true
            if !isSessionActive { requestHealthKitPermission() }
            WKInterfaceDevice.current().play(.start)

        case "session_end":
            stopSession()

        default:
            break
        }
    }
}
