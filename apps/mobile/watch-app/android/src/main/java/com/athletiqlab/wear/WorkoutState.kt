package com.athletiqlab.wear

data class ExercisePayload(
    val sessionId: String = "",
    val exerciseName: String = "",
    val setNumber: Int = 0,
    val totalSets: Int = 0,
    val reps: Int = 0,
    val loadKg: Double? = null,
    val phase: Phase = Phase.IDLE,
    val restSeconds: Int = 60,
) {
    enum class Phase { IDLE, ACTIVE, RESTING }
}
