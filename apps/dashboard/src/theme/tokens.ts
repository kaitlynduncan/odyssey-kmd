// Centralized design tokens. Every primitive component and the UI library
// route both read from this file directly — there is no second copy of
// these values anywhere in the app.

export const color = {
  // Base surfaces
  bg: "#F7F6F3",
  surface: "#FFFFFF",
  surfaceSunken: "#EFEDE7",
  border: "#E2E0D8",
  borderStrong: "#C9C6BA",

  // Text
  textPrimary: "#211F1A",
  textSecondary: "#5C594F",
  textMuted: "#8D897C",
  textInverse: "#FFFFFF",

  // Brand / accent — a restaurant-ops product reads warmer than a generic
  // SaaS blue; this is a deliberate deep umber, not the default indigo.
  accent: "#7A4A2B",
  accentHover: "#5F3A21",
  accentSubtle: "#F1E6DB",

  // Semantic states
  success: "#2F6B4F",
  successSubtle: "#E4F0E9",
  warning: "#95601D",
  warningSubtle: "#FBF0DE",
  danger: "#A23B2E",
  dangerSubtle: "#FBEAE7",
  info: "#2E5C8A",
  infoSubtle: "#E7F0F8",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const elevation = {
  none: { shadowOpacity: 0, elevation: 0 },
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  high: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const typography = {
  fontFamily: "System",
  display: { fontSize: 28, fontWeight: "600" as const, lineHeight: 34 },
  h1: { fontSize: 22, fontWeight: "600" as const, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  h3: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 21 },
  bodyStrong: { fontSize: 14, fontWeight: "600" as const, lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
} as const;

// Named semantic-state colors, used by Badge/Toast/inline validation so
// "success" always means the same green everywhere.
export const semanticState = {
  success: { fg: color.success, bg: color.successSubtle },
  warning: { fg: color.warning, bg: color.warningSubtle },
  danger: { fg: color.danger, bg: color.dangerSubtle },
  info: { fg: color.info, bg: color.infoSubtle },
  neutral: { fg: color.textSecondary, bg: color.surfaceSunken },
} as const;

export type SemanticState = keyof typeof semanticState;
