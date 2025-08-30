// src/navigation/DashboardGate.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import AuthStackNavigator from "./AuthStackNavigator";
import DashboardStackNavigator from "./DashboardStackNavigator";

export default function DashboardGate() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let unsub: () => void;

    const bootstrap = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setIsAuthed(!!sessionData.session);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthed(!!session);
      });

      unsub = sub.subscription.unsubscribe;
      setReady(true);
    };

    bootstrap();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return isAuthed ? <DashboardStackNavigator /> : <AuthStackNavigator />;
}
