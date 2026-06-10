package com.athletiqlab.wear.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.athletiqlab.wear.ExercisePayload

@Composable
fun WearApp(
    state: ExercisePayload,
    heartRate: Int,
    onSessionEnd: () -> Unit,
) {
    MaterialTheme {
        when (state.phase) {
            ExercisePayload.Phase.IDLE -> IdleScreen()
            ExercisePayload.Phase.RESTING -> RestTimerScreen(
                restSeconds = state.restSeconds,
                exerciseName = state.exerciseName,
                heartRate = heartRate,
            )
            ExercisePayload.Phase.ACTIVE -> ExerciseScreen(
                state = state,
                heartRate = heartRate,
                onSessionEnd = onSessionEnd,
            )
        }
    }
}

@Composable
fun IdleScreen() {
    Box(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colors.background),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("AthletiQLab", fontWeight = FontWeight.Bold, color = MaterialTheme.colors.primary)
            Text("Aguardando treino...", fontSize = 12.sp, color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f), textAlign = TextAlign.Center)
        }
    }
}

@Composable
fun ExerciseScreen(
    state: ExercisePayload,
    heartRate: Int,
    onSessionEnd: () -> Unit,
) {
    ScalingLazyColumn(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colors.background),
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        item {
            Text(
                text = state.exerciseName,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
                maxLines = 2,
            )
        }
        item {
            Text(
                text = "${state.setNumber}/${state.totalSets} séries · ${state.reps} reps",
                fontSize = 13.sp,
                color = MaterialTheme.colors.primary,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        if (state.loadKg != null) {
            item {
                Text(
                    text = "%.1f kg".format(state.loadKg),
                    fontSize = 13.sp,
                    color = MaterialTheme.colors.onSurface.copy(alpha = 0.7f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
        if (heartRate > 0) {
            item {
                Text(
                    text = "♥ $heartRate bpm",
                    fontSize = 12.sp,
                    color = androidx.compose.ui.graphics.Color.Red,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
        // Set dots
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
            ) {
                for (i in 0 until state.totalSets) {
                    val filled = i < state.setNumber
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .padding(horizontal = 2.dp)
                            .background(
                                color = if (filled) MaterialTheme.colors.primary else MaterialTheme.colors.onSurface.copy(alpha = 0.3f),
                                shape = androidx.compose.foundation.shape.CircleShape,
                            ),
                    )
                }
            }
        }
    }
}

@Composable
fun RestTimerScreen(
    restSeconds: Int,
    exerciseName: String,
    heartRate: Int,
) {
    var secondsLeft by remember(restSeconds) { mutableStateOf(restSeconds) }

    LaunchedEffect(restSeconds) {
        secondsLeft = restSeconds
        while (secondsLeft > 0) {
            kotlinx.coroutines.delay(1_000)
            secondsLeft--
        }
    }

    Box(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colors.background),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = "$secondsLeft",
                fontSize = 40.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colors.primary,
            )
            Text("descanso", fontSize = 11.sp, color = MaterialTheme.colors.onSurface.copy(alpha = 0.6f))
            Text(exerciseName, fontSize = 11.sp, textAlign = TextAlign.Center, maxLines = 1)
            if (heartRate > 0) {
                Text("♥ $heartRate bpm", fontSize = 11.sp, color = androidx.compose.ui.graphics.Color.Red)
            }
        }
    }
}
