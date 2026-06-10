import SwiftUI

struct ExerciseView: View {
    @EnvironmentObject var workoutManager: WorkoutManager

    var body: some View {
        let state = workoutManager.exerciseState

        ScrollView {
            VStack(alignment: .leading, spacing: 6) {
                // Exercise name
                Text(state.exerciseName)
                    .font(.headline)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)

                Divider()

                // Sets progress
                HStack {
                    Label("\(state.setNumber)/\(state.totalSets)", systemImage: "number.circle.fill")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                    Spacer()
                    Text("\(state.reps) reps")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                if let load = state.loadKg {
                    HStack {
                        Image(systemName: "scalemass.fill")
                            .foregroundColor(.orange)
                        Text(String(format: "%.1f kg", load))
                            .font(.subheadline)
                    }
                }

                Divider()

                // Heart rate
                if workoutManager.heartRate > 0 {
                    HStack {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        Text("\(Int(workoutManager.heartRate)) bpm")
                            .font(.caption)
                    }
                }

                // Set dots
                SetDotsView(completed: state.setNumber, total: state.totalSets)
                    .padding(.top, 4)
            }
            .padding()
        }
    }
}

struct SetDotsView: View {
    let completed: Int
    let total: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<total, id: \.self) { i in
                Circle()
                    .fill(i < completed ? Color.blue : Color.gray.opacity(0.4))
                    .frame(width: 8, height: 8)
            }
        }
    }
}
