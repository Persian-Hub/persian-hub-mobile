// app.config.ts
import "dotenv/config";
import { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: "Persian Hub",
  slug: "persian-hub-mobile",
  owner: "arsalandk",
  version: "1.0.0",
  runtimeVersion: "1.0.0",

  scheme: "persianhub",

  ios: {
    bundleIdentifier: "com.persianhub.app",
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Allow location to show nearby Persian businesses.",
      NSPhotoLibraryUsageDescription:
        "Allow photo library access to upload business photos.",
      NSCameraUsageDescription:
        "Allow camera access to add photos of your business.",
    },
  },

  android: {
    package: "com.persianhub.app",
    versionCode: 1,
    permissions: [
      "ACCESS_FINE_LOCATION",
      "READ_MEDIA_IMAGES",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
    ],
  },

  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  icon: "./assets/icon.png",
  androidStatusBar: { backgroundColor: "#ffffff", barStyle: "dark-content" },

  plugins: [
    ["expo-image-picker", {
      photosPermission:
        "Allow Persian Hub to access your photos to upload business images.",
    }],
    ["expo-location", {
      locationAlwaysAndWhenInUsePermission:
        "Allow Persian Hub to access your location to show nearby businesses.",
    }],
  ],

  extra: {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    GOOGLE_PLACES_KEY: process.env.EXPO_PUBLIC_GOOGLE_PLACES_REST_KEY,

    // 🔴 REQUIRED for EAS with dynamic config:
    eas: {
      projectId: "832feafd-fb4a-43ae-84f1-1537588fadaf",
    },
  },

  experiments: {
    tsconfigPaths: true,
  },
});
