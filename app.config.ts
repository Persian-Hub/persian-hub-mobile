// app.config.ts
import "dotenv/config";
import { ConfigContext, ExpoConfig } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Persian Hub",
  slug: "persian-hub-mobile",
  owner: "arsalandk",
  // Deep link scheme used by AuthSession + Supabase redirect
  scheme: "persianhub",

  ios: { bundleIdentifier: "com.persianhub.app" },

  android: {
    package: "com.persianhub.app",
    // Route persianhub://auth back into the app on Android
    intentFilters: [
      {
        action: "VIEW",
        data: [{ scheme: "persianhub", host: "auth" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  extra: {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },

  experiments: {
    tsconfigPaths: true,
  },
});
