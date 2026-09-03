import React, { useState } from "react";
import { View, Text, ScrollView, Switch } from "react-native";
import { Card } from "@/components/primitives/Card";
import { Input } from "@/components/primitives/Input";
import { Button } from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import { color, spacing, typography } from "@/theme/tokens";

export default function SettingsPage() {
  const toast = useToast();
  const [prepTime, setPrepTime] = useState("20");
  const [autoAccept, setAutoAccept] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  function handleSave() {
    // Swap for usePatchSettings().mutate({ data: { prepTimeMinutes: Number(prepTime), autoAccept, isAcceptingOrders } })
    toast.show("Settings saved", "success");
  }

  return (
    <ScrollView>
      <Text style={[typography.display, { marginBottom: spacing.xl }]}>Settings</Text>

      <Card style={{ gap: spacing.xl, maxWidth: 480 }}>
        <Input
          label="Default prep time (minutes)"
          value={prepTime}
          onChangeText={setPrepTime}
          helpText="Shown to customers as the estimated wait for a new order"
        />

        <ToggleRow
          label="Auto-accept new orders"
          description="Skip the manual accept step and move straight to preparing"
          value={autoAccept}
          onChange={setAutoAccept}
        />

        <ToggleRow
          label="Accepting orders"
          description="Turn off to pause new orders during a rush or closure"
          value={isAcceptingOrders}
          onChange={setIsAcceptingOrders}
        />

        <Button label="Save changes" onPress={handleSave} />
      </Card>
    </ScrollView>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View style={{ flex: 1, marginRight: spacing.lg }}>
        <Text style={typography.bodyStrong}>{label}</Text>
        <Text style={[typography.caption, { color: color.textMuted }]}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: color.accent }} />
    </View>
  );
}
