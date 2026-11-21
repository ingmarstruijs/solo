pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "solo"

include(":android")
include(":android-tv")
include(":contracts")

project(":android").projectDir = file("android")
project(":android-tv").projectDir = file("android-tv")
project(":contracts").projectDir = file("contracts")
