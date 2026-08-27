# Tout’s Routes & CapTout — Developer Handoff

**Prepared:** 26 August 2026  
**Purpose:** This handoff contains the current source-code locations, the iOS launch-crash diagnosis and fix, and the requirements for producing testable iPhone release builds before another App Store submission.

> **Important:** Do not resubmit either app to Apple until the new release IPA has been installed and opened successfully on a physical iPhone.

## 1. Applications and source revisions

| Application | Purpose | GitHub repository | Required iOS bundle ID | Latest relevant source revision |
|---|---|---|---|---|
| **Tout’s Routes Passenger** | Passenger ride-hailing application | `https://github.com/tout-routes-control-panel/ToutApp_1779770027` | `com.toutroutesapp` | `b3d77ea` |
| **CapTout** | Captain/driver ride-hailing application | `https://github.com/tout-routes-control-panel/CaptoutApp_1779770027` | `com.captoutapp` | `c751679` |

Both repositories use the iOS project and scheme named `ToutRoutesApp`. The display name must remain **CapTout** for the captain application.

## 2. iOS launch-crash diagnosis and fix

Apple reported that both submissions crashed on launch. The shared native startup issue was that `AppDelegate.swift` called Firebase configuration during application launch while the required Firebase iOS configuration file was not packaged into the archive.

The corrected source now uses guarded Firebase initialization. It looks for `GoogleService-Info.plist` in the built app bundle, initializes Firebase only if a valid configuration is present, and logs the missing configuration instead of terminating the process. The Passenger source also guards Google Maps initialization so an empty iOS Maps key does not crash the app at startup.

The iOS project now contains a Release-build safeguard that copies `ios/GoogleService-Info.plist` into the generated `.app` bundle and fails the Release archive deliberately if the file has not been supplied. This avoids creating another apparently successful IPA that crashes at launch because Firebase was omitted.

| Source file | Change applied |
|---|---|
| `ios/ToutRoutesApp/AppDelegate.swift` | Safe Firebase initialization in both applications; safe non-empty Google Maps key handling in Passenger. |
| `ios/ToutRoutesApp.xcodeproj/project.pbxproj` | Release archive copies `GoogleService-Info.plist` into the application resource bundle and fails clearly if the file is absent. |
| `codemagic.yaml` | Secure Firebase configuration loading; IPA retained as an artifact for physical-device testing. |
| `.gitignore` | Firebase config and signing material are intentionally excluded from Git. |

## 3. Files the developer must obtain securely

The source archives deliberately **do not include** passwords, signing certificates, provisioning profiles, private API keys, Firebase configuration files, or production credentials. Obtain them from the app owner through a secure channel.

| Application | Required Firebase file | Where it must be placed before iOS archive | Required Apple signing record |
|---|---|---|---|
| Tout’s Routes Passenger | `GoogleService-Info.plist` registered for `com.toutroutesapp` | `ios/GoogleService-Info.plist` | App Store distribution certificate and App Store provisioning profile for `com.toutroutesapp` |
| CapTout | `GoogleService-Info.plist` registered for `com.captoutapp` | `ios/GoogleService-Info.plist` | App Store distribution certificate and App Store provisioning profile for `com.captoutapp` |

The owner must also provide access to the **Apple Developer Program team that owns the existing app identifiers**. A newly created Apple account cannot sign updates for the existing applications. The team may either add the developer with the necessary permissions or provide signing assets through an approved secure process.

For Passenger maps, use a valid iOS-restricted Google Maps SDK key. Do not embed or commit the key in source control.

## 4. Local macOS build procedure

Use a macOS machine with a supported Xcode version, CocoaPods, Node.js, and the Apple Developer team available in Xcode. The repository contains a React Native application.

### 4.1 Install JavaScript and CocoaPods dependencies

Run the following from the repository root:

```bash
npm ci --legacy-peer-deps || npm install --legacy-peer-deps
cd ios
pod install --repo-update
cd ..
```

### 4.2 Add native configurations

Before archiving, add the appropriate Firebase file:

```bash
# Passenger
cp /secure/path/Passenger-GoogleService-Info.plist ios/GoogleService-Info.plist

# CapTout
cp /secure/path/CapTout-GoogleService-Info.plist ios/GoogleService-Info.plist
```

In Xcode, open `ios/ToutRoutesApp.xcworkspace` rather than the `.xcodeproj` file. Select the `ToutRoutesApp` target and confirm the exact bundle ID listed above. Select the Apple Developer team that owns that bundle ID and use an **App Store** distribution profile.

### 4.3 Archive and export

Archive one app at a time:

```bash
xcodebuild \
  -workspace ios/ToutRoutesApp.xcworkspace \
  -scheme ToutRoutesApp \
  -configuration Release \
  -archivePath build/ToutRoutesApp.xcarchive \
  archive
```

Export the archive using App Store distribution options or use Xcode **Product → Archive → Distribute App**. The developer must verify the generated IPA contains `GoogleService-Info.plist` in the app bundle before uploading.

## 5. Codemagic procedure

The two repositories have a workflow called `ios-release`. GitHub Actions were changed to manual-only execution so they do not trigger unrelated Android build emails on every push.

To use Codemagic:

1. Import the correct `main` branch of each repository.
2. In the relevant Codemagic application, add secret environment variable `FIREBASE_IOS_CONFIG` to group `firebase_credentials`. Its value must be the **complete contents** of the correct app’s `GoogleService-Info.plist` file.
3. Connect the Apple Developer Portal integration in Codemagic using an App Store Connect API key that belongs to the Apple Developer team owning the bundle IDs.
4. Ensure an App Store provisioning profile exists for the application bundle ID. The error `No matching profiles found` means this Apple signing prerequisite is missing; it is not a React Native or Firebase compilation error.
5. Start the `ios-release` workflow from branch `main`.
6. Download the IPA artifact, install it through TestFlight or an approved internal distribution method, and test a physical iPhone before any App Store submission.

Codemagic documents that its Apple Developer Portal integration requires an App Store Connect API key, including the issuer ID, key ID, and the private `.p8` key file.[1] It also documents storing Firebase configuration outside Git and loading it as a secret build variable.[2]

## 6. Mandatory physical-device test checklist

Test **both** apps with a Release/TestFlight build on a real current iPhone. The developer must capture the crash log and stop if any step fails.

| Test | Passenger | CapTout |
|---|---:|---:|
| App installs and opens from a cold launch | Required | Required |
| App reopens after being backgrounded | Required | Required |
| Firebase configuration is loaded without crash | Required | Required |
| Login screen opens and user can authenticate | Required | Required |
| Map view opens without a startup failure | Required | Required |
| Push-notification permissions do not crash the app | Required | Required |
| Basic booking/captain-request flow can be reached | Required | Required |

Only after the Release build opens normally should it be uploaded to App Store Connect. The developer should increment the build number for each upload.

## 7. Android note

These archives are source packages for both platforms. Android Firebase configuration and signing files are excluded from the handoff package to prevent accidental exposure. To produce Android artifacts, obtain the correct Android Firebase config and release signing credentials from the owner, then build from the `android` directory. The Android Google Play output should be an **AAB**, not an APK, for production submission.

## 8. Do not change without confirmation

Do not change the following identifiers while preparing the fixes:

| Application | Android package previously used for its Apple/Firebase source pairing | iOS bundle ID |
|---|---|---|
| Tout’s Routes Passenger | `com.toutroutesapp` | `com.toutroutesapp` |
| CapTout | `com.captoutapp` | `com.captoutapp` |

The Android Play migration work uses a separate Passenger package strategy. This iOS handoff relates to the existing Apple submission identifiers that Apple reviewed.

## References

[1] [Codemagic — Apple Developer Portal integration and App Store Connect publishing](https://docs.codemagic.io/yaml-publishing/app-store-connect/)

[2] [Codemagic — Loading Firebase configuration securely](https://docs.codemagic.io/knowledge-firebase/load-firebase-configuration/)

[3] [Firebase — Add Firebase to an Apple platform project](https://firebase.google.com/docs/ios/setup)
