package com.athletiqlab.wear

import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.content.getSystemService
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject

class DataLayerService : WearableListenerService() {

    companion object {
        private val _exerciseState = MutableStateFlow(ExercisePayload())
        val exerciseState: StateFlow<ExercisePayload> = _exerciseState

        private val _heartRate = MutableStateFlow(0)
        val heartRate: StateFlow<Int> = _heartRate

        fun clearSession() {
            _exerciseState.value = ExercisePayload()
            _heartRate.value = 0
        }

        fun updateHeartRate(bpm: Int) {
            _heartRate.value = bpm
        }
    }

    override fun onMessageReceived(event: MessageEvent) {
        if (event.path != "/workout") return
        val json = JSONObject(String(event.data, Charsets.UTF_8))

        when (json.optString("type")) {
            "exercise" -> {
                val phaseStr = json.optString("phase", "active")
                _exerciseState.value = ExercisePayload(
                    sessionId = json.optString("sessionId"),
                    exerciseName = json.optString("exerciseName"),
                    setNumber = json.optInt("setNumber"),
                    totalSets = json.optInt("totalSets"),
                    reps = json.optInt("reps"),
                    loadKg = if (json.isNull("loadKg")) null else json.optDouble("loadKg"),
                    phase = if (phaseStr == "resting") ExercisePayload.Phase.RESTING
                             else ExercisePayload.Phase.ACTIVE,
                    restSeconds = json.optInt("restSeconds", 60),
                )
                vibrateOnce()
            }
            "session_end" -> {
                clearSession()
                vibrateOnce()
            }
        }
    }

    private fun vibrateOnce() {
        val vibrator = getSystemService<Vibrator>() ?: return
        vibrator.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
    }
}
