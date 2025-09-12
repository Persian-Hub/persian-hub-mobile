import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Linking, Platform } from "react-native";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const makeOAuthRedirect = () => {
  if (Platform.OS === "web") return AuthSession.makeRedirectUri({ path: "auth" });
  return AuthSession.makeRedirectUri({ scheme: "persianhub", path: "auth" });
};

export default function GoogleButton({
  onStart,
  onDone,
  loading,
}: {
  onStart?: () => void;
  onDone?: () => void;
  loading?: boolean;
}) {
  const signInWithGoogle = async () => {
    try {
      onStart?.();
      const redirectTo = makeOAuthRedirect();

      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: { access_type: "offline", prompt: "consent" },
          },
        });
        if (error) throw error;
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;

      const authUrl = data?.url;
      if (!authUrl) throw new Error("No auth URL returned from Supabase.");

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
      if (result.type === "success" && result.url) {
        await Linking.openURL(result.url);
      }
    } catch (e: any) {
      console.warn(e);
    } finally {
      onDone?.();
    }
  };

  return (
    <TouchableOpacity
      onPress={signInWithGoogle}
      activeOpacity={0.9}
      style={styles.btn}
      disabled={!!loading}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.row}>
          <Text style={styles.g}>G</Text>
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const R = 14;
const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: R,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 as any },
  g: { fontSize: 18, fontWeight: "900", color: "#EA4335" },
  text: { fontSize: 15, fontWeight: "700", color: "#111827" },
});
