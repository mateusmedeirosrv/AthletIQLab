import SwiftUI

struct ContentView: View {
    @EnvironmentObject var workoutManager: WorkoutManager

    var body: some View {
        if !workoutManager.isSessionActive {
            IdleView()
        } else if workoutManager.exerciseState.phase == .resting {
            RestTimerView()
                .environmentObject(workoutManager)
        } else {
            ExerciseView()
                .environmentObject(workoutManager)
        }
    }
}

struct IdleView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "figure.strengthtraining.traditional")
                .font(.system(size: 36))
                .foregroundColor(.blue)
            Text("AthletiQLab")
                .font(.headline)
            Text("Aguardando treino...")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}
