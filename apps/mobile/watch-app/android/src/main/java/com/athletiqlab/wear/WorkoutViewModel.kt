package com.athletiqlab.wear

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class WorkoutViewModel(app: Application) : AndroidViewModel(app) {
    val exerciseState: StateFlow<ExercisePayload> = DataLayerService.exerciseState
    val heartRate: StateFlow<Int> = DataLayerService.heartRate

    fun stopSession() {
        DataLayerService.clearSession()
    }
}
