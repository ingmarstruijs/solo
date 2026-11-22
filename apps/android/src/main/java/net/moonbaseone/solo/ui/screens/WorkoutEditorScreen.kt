package net.moonbaseone.solo.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import net.moonbaseone.solo.domain.emptyExercise
import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.SetMetric
import net.moonbaseone.solo.domain.model.WorkoutExercise
import net.moonbaseone.solo.domain.model.WorkoutTemplate
import net.moonbaseone.solo.domain.newId
import net.moonbaseone.solo.ui.components.SoftSurface
import net.moonbaseone.solo.wger.WgerClient
import net.moonbaseone.solo.wger.WgerHit

@Composable
fun WorkoutEditorScreen(
    initial: WorkoutTemplate?,
    onSave: (
        name: String,
        description: String?,
        exercises: List<WorkoutExercise>,
        sets: Int,
        restBetweenSets: Int,
        circuitRounds: Int?,
        restBetweenRounds: Int?,
        favorite: Boolean,
    ) -> Unit,
    onDelete: (() -> Unit)?,
    onBack: () -> Unit,
) {
    var name by remember { mutableStateOf(initial?.name.orEmpty()) }
    var description by remember { mutableStateOf(initial?.description.orEmpty()) }
    var sets by remember { mutableIntStateOf(initial?.sets ?: 3) }
    var restBetweenSets by remember { mutableIntStateOf(initial?.restBetweenSets ?: 90) }
    var isCircuit by remember {
        mutableStateOf((initial?.circuitRounds ?: 0) > 1 || initial?.tags?.contains("circuit") == true)
    }
    var circuitRounds by remember { mutableIntStateOf(initial?.circuitRounds ?: 3) }
    var restBetweenRounds by remember { mutableIntStateOf(initial?.restBetweenRounds ?: 60) }
    var favorite by remember { mutableStateOf(initial?.favorite ?: false) }
    val exercises =
        remember {
            mutableStateListOf<WorkoutExercise>().also { list ->
                val seed = initial?.exercises.orEmpty()
                if (seed.isEmpty()) list.add(emptyExercise()) else list.addAll(seed)
            }
        }
    var showWger by remember { mutableStateOf(false) }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("screen_workout_editor"),
    ) {
        Text(
            if (initial == null) "New workout" else "Edit workout",
            style = MaterialTheme.typography.headlineMedium,
        )
        Spacer(Modifier.height(12.dp))
        SoftSurface {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().testTag("workout_name"),
            )
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Favorite", modifier = Modifier.weight(1f))
                Switch(checked = favorite, onCheckedChange = { favorite = it }, modifier = Modifier.testTag("workout_favorite"))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Circuit mode", modifier = Modifier.weight(1f))
                Switch(checked = isCircuit, onCheckedChange = { isCircuit = it })
            }
            if (isCircuit) {
                IntField("Rounds", circuitRounds) { circuitRounds = it.coerceAtLeast(1) }
                IntField("Rest between rounds (s)", restBetweenRounds) { restBetweenRounds = it.coerceAtLeast(0) }
            } else {
                IntField("Sets", sets) { sets = it.coerceAtLeast(1) }
                IntField("Rest between sets (s)", restBetweenSets) { restBetweenSets = it.coerceAtLeast(0) }
            }
        }

        Spacer(Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Exercises", style = MaterialTheme.typography.titleLarge)
            OutlinedButton(
                onClick = { showWger = !showWger },
                modifier = Modifier.testTag("workout_wger_toggle"),
            ) {
                Text(if (showWger) "Hide Wger" else "Wger search")
            }
        }
        if (showWger) {
            WgerSearchPanel(
                onPick = { hit ->
                    exercises.add(
                        emptyExercise(newId()).copy(
                            name = hit.name,
                            description = hit.description,
                        ),
                    )
                },
            )
        }
        exercises.forEachIndexed { index, ex ->
            SoftSurface(modifier = Modifier.padding(top = 10.dp).testTag("exercise_${ex.id}")) {
                ExerciseEditorCard(
                    exercise = ex,
                    onChange = { exercises[index] = it },
                    onRemove = {
                        if (exercises.size > 1) exercises.removeAt(index)
                    },
                )
            }
        }
        OutlinedButton(
            onClick = { exercises.add(emptyExercise(newId())) },
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp).testTag("workout_add_exercise"),
        ) {
            Text("Add exercise")
        }

        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                if (name.isBlank()) return@Button
                onSave(
                    name,
                    description.ifBlank { null },
                    exercises.toList(),
                    if (isCircuit) 1 else sets,
                    if (isCircuit) 0 else restBetweenSets,
                    if (isCircuit) circuitRounds else null,
                    if (isCircuit) restBetweenRounds else null,
                    favorite,
                )
            },
            enabled = name.isNotBlank(),
            modifier = Modifier.fillMaxWidth().testTag("workout_save"),
        ) {
            Text("Save")
        }
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        ) {
            Text("Cancel")
        }
        if (onDelete != null) {
            OutlinedButton(
                onClick = onDelete,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp).testTag("workout_delete"),
            ) {
                Text("Delete workout")
            }
        }
    }
}

@Composable
private fun WgerSearchPanel(onPick: (WgerHit) -> Unit) {
    val scope = rememberCoroutineScope()
    val client = remember { WgerClient() }
    var query by remember { mutableStateOf("") }
    var hits by remember { mutableStateOf<List<WgerHit>>(emptyList()) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    SoftSurface(modifier = Modifier.padding(top = 8.dp).testTag("wger_panel")) {
        Text("Import from Wger", style = MaterialTheme.typography.titleMedium)
        Text(
            "Public exercise catalog · names only · on-device save",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
        )
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("wger_query"),
        )
        Button(
            onClick = {
                busy = true
                error = null
                scope.launch {
                    try {
                        hits = client.search(query)
                        if (hits.isEmpty()) error = "No matches"
                    } catch (e: Exception) {
                        error = e.message ?: "Search failed"
                        hits = emptyList()
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = query.isNotBlank() && !busy,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp).testTag("wger_search"),
        ) {
            Text(if (busy) "Searching…" else "Search")
        }
        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
        hits.forEach { hit ->
            Text(
                hit.name,
                style = MaterialTheme.typography.bodyLarge,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .clickable { onPick(hit) }
                        .padding(vertical = 8.dp)
                        .testTag("wger_hit_${hit.id}"),
            )
        }
    }
}

@Composable
private fun IntField(
    label: String,
    value: Int,
    onChange: (Int) -> Unit,
) {
    OutlinedTextField(
        value = value.toString(),
        onValueChange = { raw -> raw.filter { it.isDigit() }.take(4).toIntOrNull()?.let(onChange) },
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
    )
}

@Composable
private fun ExerciseEditorCard(
    exercise: WorkoutExercise,
    onChange: (WorkoutExercise) -> Unit,
    onRemove: () -> Unit,
) {
    OutlinedTextField(
        value = exercise.name,
        onValueChange = { onChange(exercise.copy(name = it)) },
        label = { Text("Exercise name") },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
    )
    Spacer(Modifier.height(8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        SetMetric.entries.forEach { metric ->
            FilterChip(
                selected = exercise.metric == metric,
                onClick = { onChange(exercise.copy(metric = metric)) },
                label = { Text(metric.name) },
            )
        }
    }
    IntField("Target", exercise.target) { onChange(exercise.copy(target = it.coerceAtLeast(1))) }
    OutlinedTextField(
        value = if (exercise.weightKg == 0.0) "" else exercise.weightKg.toString(),
        onValueChange = { raw ->
            val kg = raw.filter { ch -> ch.isDigit() || ch == '.' }.toDoubleOrNull() ?: 0.0
            onChange(exercise.copy(weightKg = kg))
        },
        label = { Text("Weight (kg)") },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
    )
    IntField("Rest (s)", exercise.restSeconds) { onChange(exercise.copy(restSeconds = it.coerceAtLeast(0))) }
    Text("Equipment", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = 8.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
        listOf(
            EquipmentCategory.dumbbell,
            EquipmentCategory.barbell,
            EquipmentCategory.kettlebell,
            EquipmentCategory.bodyweight,
            EquipmentCategory.resistance_band,
        ).forEach { cat ->
            val selected = cat in exercise.equipment
            FilterChip(
                selected = selected,
                onClick = {
                    val next =
                        if (selected) {
                            exercise.equipment - cat
                        } else {
                            exercise.equipment + cat
                        }
                    onChange(exercise.copy(equipment = next))
                },
                label = { Text(cat.name.take(6)) },
            )
        }
    }
    OutlinedButton(onClick = onRemove, modifier = Modifier.padding(top = 8.dp)) {
        Text("Remove exercise")
    }
}
