package net.moonbaseone.solo.domain

import kotlinx.serialization.json.Json

val DomainJson: Json =
    Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        prettyPrint = false
    }
