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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.LockerItem
import net.moonbaseone.solo.domain.model.SoloSnapshot
import net.moonbaseone.solo.ui.components.SoftSurface

@Composable
fun LockerScreen(
    snapshot: SoloSnapshot,
    onSave: (
        existingId: String?,
        name: String,
        brand: String,
        category: EquipmentCategory,
        weightKg: Double?,
        resistance: String?,
        notes: String?,
    ) -> Unit,
    onDelete: (String) -> Unit,
) {
    var editing by remember { mutableStateOf<LockerItem?>(null) }
    var adding by remember { mutableStateOf(false) }

    if (adding || editing != null) {
        LockerEditor(
            initial = editing,
            onSave = { name, brand, category, weightKg, resistance, notes ->
                onSave(editing?.id, name, brand, category, weightKg, resistance, notes)
                editing = null
                adding = false
            },
            onCancel = {
                editing = null
                adding = false
            },
            onDelete =
                editing?.let { item ->
                    {
                        onDelete(item.id)
                        editing = null
                        adding = false
                    }
                },
        )
        return
    }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .testTag("screen_locker"),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("Locker", style = MaterialTheme.typography.headlineMedium)
            OutlinedButton(onClick = { adding = true }, modifier = Modifier.testTag("locker_add")) {
                Text("Add")
            }
        }
        Text(
            "Home equipment used for overload matching",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 12.dp),
        )
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(snapshot.locker, key = { it.id }) { item ->
                val weight =
                    item.weightKg?.let { "${it} kg" }
                        ?: item.resistance
                        ?: "—"
                SoftSurface(
                    modifier =
                        Modifier
                            .clickable { editing = item }
                            .testTag("locker_${item.id}"),
                ) {
                    Text(item.name, style = MaterialTheme.typography.titleMedium)
                    Text(
                        "${item.category.name} · $weight",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LockerEditor(
    initial: LockerItem?,
    onSave: (
        name: String,
        brand: String,
        category: EquipmentCategory,
        weightKg: Double?,
        resistance: String?,
        notes: String?,
    ) -> Unit,
    onCancel: () -> Unit,
    onDelete: (() -> Unit)?,
) {
    var name by remember { mutableStateOf(initial?.name.orEmpty()) }
    var brand by remember { mutableStateOf(initial?.brand.orEmpty()) }
    var category by remember { mutableStateOf(initial?.category ?: EquipmentCategory.dumbbell) }
    var weightText by remember {
        mutableStateOf(initial?.weightKg?.toString().orEmpty())
    }
    var resistance by remember { mutableStateOf(initial?.resistance.orEmpty()) }
    var notes by remember { mutableStateOf(initial?.notes.orEmpty()) }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
                .testTag("screen_locker_editor"),
    ) {
        Text(
            if (initial == null) "Add equipment" else "Edit equipment",
            style = MaterialTheme.typography.headlineMedium,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("locker_name"),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = brand,
            onValueChange = { brand = it },
            label = { Text("Brand") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        Text("Category", style = MaterialTheme.typography.labelLarge)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            EquipmentCategory.entries.forEach { cat ->
                FilterChip(
                    selected = category == cat,
                    onClick = { category = cat },
                    label = { Text(cat.name) },
                    modifier = Modifier.testTag("locker_cat_${cat.name}"),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = weightText,
            onValueChange = { weightText = it.filter { ch -> ch.isDigit() || ch == '.' } },
            label = { Text("Weight (kg)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = resistance,
            onValueChange = { resistance = it },
            label = { Text("Resistance (bands)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = notes,
            onValueChange = { notes = it },
            label = { Text("Notes") },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                if (name.isBlank()) return@Button
                onSave(
                    name,
                    brand,
                    category,
                    weightText.toDoubleOrNull(),
                    resistance.ifBlank { null },
                    notes.ifBlank { null },
                )
            },
            enabled = name.isNotBlank(),
            modifier = Modifier.fillMaxWidth().testTag("locker_save"),
        ) {
            Text("Save")
        }
        OutlinedButton(onClick = onCancel, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
            Text("Cancel")
        }
        if (onDelete != null) {
            TextButton(
                onClick = onDelete,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp).testTag("locker_delete"),
            ) {
                Text("Delete")
            }
        }
    }
}
