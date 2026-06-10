package com.athletiqlab.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.athletiqlab.wear.presentation.WearApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val vm: WorkoutViewModel = viewModel()
            val state by vm.exerciseState.collectAsState()
            val heartRate by vm.heartRate.collectAsState()
            WearApp(state = state, heartRate = heartRate, onSessionEnd = { vm.stopSession() })
        }
    }
}
