import React from "react";
import { View, Text } from "react-native";
import { Card } from "../primitives/Card";
import { Skeleton } from "../primitives/Skeleton";
import { color, spacing, typography } from "../../theme/tokens";

export function KpiCard({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <Card style={{ flex: 1, gap: spacing.sm }}>
      <Text style={[typography.label, { color: color.textMuted }]}>{label}</Text>
      {loading ? <Skeleton width="60%" height={28} /> : <Text style={typography.display}>{value}</Text>}
    </Card>
  );
}
