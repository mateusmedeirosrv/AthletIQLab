import SwiftUI
import WatchKit

struct RestTimerView: View {
    @EnvironmentObject var workoutManager: WorkoutManager
    @State private var secondsLeft: Int = 0
    @State private var timer: Timer?
    @State private var didHaptic = false

    var body: some View {
        let total = Double(workoutManager.exerciseState.restSeconds)
        let progress = total > 0 ? Double(secondsLeft) / total : 0

        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(Color.blue, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 1), value: secondsLeft)
                VStack(spacing: 2) {
                    Text("\(secondsLeft)")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .monospacedDigit()
                    Text("descanso")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(width: 100, height: 100)

            // Next exercise hint
            Text(workoutManager.exerciseState.exerciseName)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)

            // Heart rate
            if workoutManager.heartRate > 0 {
                HStack(spacing: 4) {
                    Image(systemName: "heart.fill").foregroundColor(.red).font(.caption)
                    Text("\(Int(workoutManager.heartRate)) bpm").font(.caption)
                }
            }
        }
        .padding()
        .onAppear {
            secondsLeft = workoutManager.exerciseState.restSeconds
            didHaptic = false
            startTimer()
        }
        .onDisappear { timer?.invalidate() }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if secondsLeft > 0 {
                secondsLeft -= 1
            }
            if secondsLeft == 0 && !didHaptic {
                didHaptic = true
                timer?.invalidate()
                WKInterfaceDevice.current().play(.notification)
            }
        }
    }
}
