import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Input } from "@/components/primitives/Input";
import { Select } from "@/components/primitives/Select";
import { Badge } from "@/components/primitives/Badge";
import { Skeleton, SkeletonRows } from "@/components/primitives/Skeleton";
import { StatePanel } from "@/components/primitives/StatePanel";
import { useToast } from "@/components/primitives/Toast";
import { color, spacing, typography, radius, semanticState } from "@/theme/tokens";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xxl }}>
      <Text style={[typography.h2, { marginBottom: spacing.lg }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function UiLibraryPage() {
  const toast = useToast();
  const [selectValue, setSelectValue] = useState<"a" | "b" | "c">("a");
  const [inputValue, setInputValue] = useState("");

  return (
    <ScrollView>
      <Text style={[typography.display, { marginBottom: spacing.xl }]}>UI library</Text>

      <Section title="Color tokens">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
          {Object.entries(color).map(([name, hex]) => (
            <View key={name} style={{ width: 140 }}>
              <View style={{ height: 48, backgroundColor: hex as string, borderRadius: radius.md, borderWidth: 1, borderColor: color.border }} />
              <Text style={[typography.caption, { marginTop: spacing.xs }]}>{name}</Text>
              <Text style={[typography.caption, { color: color.textMuted }]}>{hex}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography">
        <Card style={{ gap: spacing.md }}>
          <Text style={typography.display}>Display / 28</Text>
          <Text style={typography.h1}>Heading 1 / 22</Text>
          <Text style={typography.h2}>Heading 2 / 18</Text>
          <Text style={typography.h3}>Heading 3 / 15</Text>
          <Text style={typography.bodyStrong}>Body strong / 14</Text>
          <Text style={typography.body}>Body / 14 — the quick brown fox jumps over the lazy dog</Text>
          <Text style={typography.caption}>Caption / 12</Text>
          <Text style={typography.label}>LABEL / 12</Text>
        </Card>
      </Section>

      <Section title="Spacing scale">
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
          {Object.entries(spacing).map(([name, val]) => (
            <View key={name} style={{ alignItems: "center" }}>
              <View style={{ width: val, height: val, backgroundColor: color.accent, borderRadius: 2 }} />
              <Text style={[typography.caption, { marginTop: spacing.xs }]}>{name} ({val})</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Buttons">
        <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
          <Button label="Primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Danger" variant="danger" onPress={() => {}} />
          <Button label="Disabled" onPress={() => {}} disabled />
          <Button label="Loading" onPress={() => {}} loading />
          <Button label="Small" size="sm" onPress={() => {}} />
        </View>
      </Section>

      <Section title="Form controls">
        <Card style={{ gap: spacing.lg, maxWidth: 360 }}>
          <Input label="Text input" value={inputValue} onChangeText={setInputValue} placeholder="Type something..." />
          <Input label="With error" value="" onChangeText={() => {}} error="This field is required" />
          <Input label="Disabled" value="Can't edit this" onChangeText={() => {}} disabled />
          <Select label="Select" value={selectValue} onChange={setSelectValue} options={[{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }, { label: "Option C", value: "c" }]} />
        </Card>
      </Section>

      <Section title="Badges (semantic states)">
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          {Object.keys(semanticState).map((s) => (
            <Badge key={s} label={s} state={s as any} />
          ))}
        </View>
      </Section>

      <Section title="Cards & surfaces">
        <View style={{ flexDirection: "row", gap: spacing.lg }}>
          <Card style={{ flex: 1 }}>
            <Text style={typography.bodyStrong}>Standard card</Text>
            <Text style={[typography.body, { color: color.textSecondary }]}>Default surface with low elevation.</Text>
          </Card>
        </View>
      </Section>

      <Section title="Loading, empty, and error states">
        <View style={{ gap: spacing.lg }}>
          <Card>
            <Text style={[typography.label, { color: color.textMuted, marginBottom: spacing.md }]}>LOADING</Text>
            <SkeletonRows rows={3} />
          </Card>
          <Card padded>
            <Text style={[typography.label, { color: color.textMuted, marginBottom: spacing.md }]}>EMPTY</Text>
            <StatePanel title="No results" description="Nothing matches these filters yet." />
          </Card>
          <Card padded>
            <Text style={[typography.label, { color: color.textMuted, marginBottom: spacing.md }]}>ERROR</Text>
            <StatePanel tone="error" title="Something went wrong" description="Could not load this data. Try again." actionLabel="Retry" onAction={() => {}} />
          </Card>
        </View>
      </Section>

      <Section title="Feedback / toast">
        <Button label="Trigger success toast" variant="secondary" onPress={() => toast.show("Saved successfully", "success")} />
      </Section>
    </ScrollView>
  );
}
