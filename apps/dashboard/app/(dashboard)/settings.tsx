import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useGetApiSettings, usePatchApiSettings, getGetApiSettingsQueryKey } from "api-client";
import { Card } from "@/components/primitives/Card";
import { Input } from "@/components/primitives/Input";
import { Button } from "@/components/primitives/Button";
import { Toggle } from "@/components/primitives/Toggle";
import { SkeletonRows } from "@/components/primitives/Skeleton";
import { useToast } from "@/components/primitives/Toast";
import { color, spacing, typography } from "@/theme/tokens";

export default function SettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useGetApiSettings();
  const settings = response?.data;

  const [prepTime, setPrepTime] = useState("20");
  const [autoAccept, setAutoAccept] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  useEffect(() => {
    if (settings) {
      setPrepTime(String(settings.prepTimeMinutes));
      setAutoAccept(settings.autoAccept);
      setIsAcceptingOrders(settings.isAcceptingOrders);
    }
  }, [settings]);

  const mutation = usePatchApiSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApiSettingsQueryKey() });
        toast.show("Settings saved", "success");
      },
      onError: (err: any) => toast.show(err?.body?.error?.message ?? "Could not save settings", "danger"),
    },
  });

  function handleSave() {
    mutation.mutate({ data: { prepTimeMinutes: Number(prepTime) || 0, autoAccept, isAcceptingOrders } });
  }

  if (isLoading) {
    return (
      <Card style={{ maxWidth: 480 }}>
        <SkeletonRows rows={3} />
      </Card>
    );
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

        <Button label="Save changes" loading={mutation.isPending} onPress={handleSave} />
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
      <Toggle value={value} onValueChange={onChange} />
    </View>
  );
}
