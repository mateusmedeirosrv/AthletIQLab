/**
 * Expo config plugin that adds the watchOS companion target and the Wear OS
 * module to the native projects during `expo prebuild`.
 *
 * watchOS: adds an Xcode WatchKit App + Extension target linked to the main app.
 * Wear OS: adds a Gradle sub-project and registers it with the phone app so it
 *          is bundled into the APK artifact automatically.
 */

import type { ConfigPlugin } from '@expo/config-plugins'
import { withXcodeProject, withAppBuildGradle, withSettingsGradle } from '@expo/config-plugins'
import * as fs from 'fs'
import * as path from 'path'

const WATCH_APP_DIR_NAME = 'AthletiQLabWatch'
const WATCH_BUNDLE_ID = 'com.athletiqlab.app.watchkitapp'
const WEAR_APP_DIR = 'wearapp'

// ────────────────────────────────────────────
// iOS — watchOS companion target
// ────────────────────────────────────────────

const withWatchOS: ConfigPlugin = (config) => {
  return withXcodeProject(config, (mod) => {
    const project = mod.modResults
    const iosPath = mod.modRequest.platformProjectRoot

    // Copy Swift source files into the iOS project directory
    const srcDir = path.join(__dirname, '..', 'watch-app', 'ios', WATCH_APP_DIR_NAME)
    const destDir = path.join(iosPath, WATCH_APP_DIR_NAME)

    if (fs.existsSync(srcDir) && !fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
      for (const file of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
      }
    }

    // Add WatchKit App target to the Xcode project
    const targetName = WATCH_APP_DIR_NAME
    const existingTargets = project.pbxNativeTargetSection()
    const alreadyAdded = Object.values(existingTargets).some(
      (t) => typeof t === 'object' && (t as { name?: string }).name === targetName,
    )

    if (!alreadyAdded) {
      const watchTarget = project.addTarget(
        targetName,
        'watch2_app',
        WATCH_APP_DIR_NAME,
        WATCH_BUNDLE_ID,
      )

      // Add Swift source files to the target build phase
      const swiftFiles = fs.existsSync(destDir)
        ? fs.readdirSync(destDir).filter((f) => f.endsWith('.swift'))
        : []

      for (const file of swiftFiles) {
        project.addSourceFile(path.join(WATCH_APP_DIR_NAME, file), { target: watchTarget.uuid })
      }

      // Add Info.plist
      project.addResourceFile(path.join(WATCH_APP_DIR_NAME, 'Info.plist'), {
        target: watchTarget.uuid,
      })
    }

    return mod
  })
}

// ────────────────────────────────────────────
// Android — Wear OS Gradle sub-project
// ────────────────────────────────────────────

const withWearOS: ConfigPlugin = (config) => {
  // Register the :wearapp sub-project in settings.gradle
  config = withSettingsGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(`:${WEAR_APP_DIR}`)) {
      mod.modResults.contents += `\ninclude ':${WEAR_APP_DIR}'\nproject(':${WEAR_APP_DIR}').projectDir = new File(rootProject.projectDir, '../watch-app/android')\n`
    }
    return mod
  })

  // Add wearApp dependency to the phone app's build.gradle
  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('wearApp')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    wearApp project(':${WEAR_APP_DIR}')`,
      )
    }
    return mod
  })

  return config
}

// ────────────────────────────────────────────
// Combined plugin export
// ────────────────────────────────────────────

const withWatchApp: ConfigPlugin = (config) => {
  config = withWatchOS(config)
  config = withWearOS(config)
  return config
}

export default withWatchApp
