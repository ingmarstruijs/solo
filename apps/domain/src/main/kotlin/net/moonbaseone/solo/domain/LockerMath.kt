package net.moonbaseone.solo.domain

import net.moonbaseone.solo.domain.model.EquipmentCategory
import net.moonbaseone.solo.domain.model.LockerItem

fun findClosestWeight(
    items: List<LockerItem>,
    category: EquipmentCategory,
    targetKg: Double,
): Double? {
    val weights =
        items
            .filter { it.category == category && it.weightKg != null }
            .mapNotNull { it.weightKg }
            .sorted()
    if (weights.isEmpty()) return null
    return weights.minBy { kotlin.math.abs(it - targetKg) }
}

fun findMaxWeight(
    items: List<LockerItem>,
    category: EquipmentCategory,
): Double? {
    val weights =
        items
            .filter { it.category == category && it.weightKg != null }
            .mapNotNull { it.weightKg }
    if (weights.isEmpty()) return null
    return weights.maxOrNull()
}
