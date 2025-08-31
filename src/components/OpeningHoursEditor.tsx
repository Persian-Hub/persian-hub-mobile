// src/components/OpeningHoursEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

type LowerDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const ORDER: LowerDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const LABEL: Record<LowerDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export type DbHoursMap = Record<LowerDay, string>; // "09:00 - 17:00" or ""

export const emptyDbHours = (): DbHoursMap => ({
  mon: "",
  tue: "",
  wed: "",
  thu: "",
  fri: "",
  sat: "",
  sun: "",
});

function parseRange(s: string | undefined | null): { open: Date; close: Date; enabled: boolean } {
  if (!s) return { open: new Date(0, 0, 0, 9, 0), close: new Date(0, 0, 0, 17, 0), enabled: false };
  const m = s.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (!m) return { open: new Date(0, 0, 0, 9, 0), close: new Date(0, 0, 0, 17, 0), enabled: false };
  const o = new Date(0, 0, 0, Number(m[1]), Number(m[2]));
  const c = new Date(0, 0, 0, Number(m[3]), Number(m[4]));
  return { open: o, close: c, enabled: true };
}

function fmt(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function OpeningHoursEditor({
  value,
  onChange,
}: {
  value: DbHoursMap;
  onChange: (v: DbHoursMap) => void;
}) {
  const [state, setState] = useState(
    ORDER.reduce((acc, day) => {
      const { open, close, enabled } = parseRange(value?.[day]);
      acc[day] = { open, close, enabled };
      return acc;
    }, {} as Record<LowerDay, { open: Date; close: Date; enabled: boolean }>)
  );

  useEffect(() => {
    const out: DbHoursMap = { ...emptyDbHours() };
    ORDER.forEach((d) => {
      out[d] = state[d].enabled ? `${fmt(state[d].open)} - ${fmt(state[d].close)}` : "";
    });
    onChange(out);
  }, [state, onChange]);

  const [picker, setPicker] = useState<{ day: LowerDay; field: "open" | "close" } | null>(null);

  const onPick = (_: DateTimePickerEvent, date?: Date) => {
    if (!picker) return;
    if (date) {
      setState((s) => ({
        ...s,
        [picker.day]: { ...s[picker.day], [picker.field]: date },
      }));
    }
    if (Platform.OS !== "ios") setPicker(null);
  };

  const rows = useMemo(
    () =>
      ORDER.map((day) => {
        const d = state[day];
        return (
          <View key={day} style={styles.row}>
            <Text style={styles.day}>{LABEL[day]}</Text>
            <Switch
              value={d.enabled}
              onValueChange={(v) => setState((s) => ({ ...s, [day]: { ...s[day], enabled: v } }))}
            />
            {d.enabled ? (
              <View style={styles.times}>
                <TouchableOpacity
                  onPress={() => setPicker({ day, field: "open" })}
                  style={styles.timeBtn}
                >
                  <Text style={styles.timeTxt}>{fmt(d.open)}</Text>
                </TouchableOpacity>
                <Text style={{ color: "#6b7280" }}>–</Text>
                <TouchableOpacity
                  onPress={() => setPicker({ day, field: "close" })}
                  style={styles.timeBtn}
                >
                  <Text style={styles.timeTxt}>{fmt(d.close)}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.closed}>Closed</Text>
            )}
          </View>
        );
      }),
    [state]
  );

  return (
    <View style={{ gap: 10 }}>
      {rows}
      {picker ? (
        <DateTimePicker
          value={state[picker.day][picker.field]}
          mode="time"
          onChange={onPick}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minuteInterval={5}
        />
      ) : null}
      <Text style={styles.hint}>Toggle each day, then pick opening and closing times.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  day: { width: 34, color: "#111827", fontWeight: "900" },
  times: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" },
  timeBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  timeTxt: { color: "#111827", fontWeight: "800" },
  closed: { marginLeft: "auto", color: "#6b7280", fontWeight: "800" },
  hint: { color: "#6b7280", marginTop: 6 },
});
