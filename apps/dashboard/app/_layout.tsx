import React from "react";
import { View, useWindowDimensions } from "react-native";
import { Slot, useRouter, usePathname } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ToastProvider } from "@/components/primitives/Toast";
import { Sidebar, NavItem } from "@/components/primitives/Sidebar";
import { color } from "@/theme/tokens";

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/home" },
  { key: "orders", label: "Orders", href: "/orders" },
  { key: "menu", label: "Menu", href: "/menu" },
  { key: "crm", label: "CRM", href: "/crm" },
  { key: "settings", label: "Settings", href: "/settings" },
  { key: "ui-library", label: "UI library", href: "/ui-library" },
];

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const activeKey = NAV_ITEMS.find((i) => pathname.startsWith(i.href))?.key ?? "home";

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <View style={{ flex: 1, flexDirection: "row", minHeight: "100%", backgroundColor: color.bg }}>
          <Sidebar items={NAV_ITEMS} activeKey={activeKey} onNavigate={(href) => router.push(href as any)} />
          <View style={{ flex: 1, padding: 32 }}>
            <Slot />
          </View>
        </View>
      </ToastProvider>
    </QueryClientProvider>
  );
}
