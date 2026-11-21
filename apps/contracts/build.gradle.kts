plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation(libs.kotlinx.serialization.json)
    testImplementation(libs.junit)
}

tasks.test {
    useJUnit()
}

// Goldens + schema live at repo-root contracts/ (shared with docs / future codegen).
val repoContractsDir = rootProject.projectDir.parentFile.resolve("contracts")

tasks.register<Copy>("syncContractGoldens") {
    from(repoContractsDir.resolve("goldens"))
    into(layout.buildDirectory.dir("contracts-goldens"))
}

tasks.register<Copy>("syncContractSchema") {
    from(repoContractsDir.resolve("tv-messages.schema.json"))
    into(layout.buildDirectory.dir("contracts-schema"))
}

tasks.named<Test>("test") {
    dependsOn("syncContractGoldens", "syncContractSchema")
    systemProperty(
        "solo.contracts.goldens",
        layout.buildDirectory.dir("contracts-goldens").get().asFile.absolutePath,
    )
}
