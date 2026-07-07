import type { Quadrant } from "../types";

export interface QuadrantConfig {
  label: string;
  subtitle: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export const QUADRANT_CONFIG: Record<Quadrant, QuadrantConfig> = {
  urgent_important: {
    label: "Do First",
    subtitle: "Urgent + Important",
    emoji: "🔴",
    color: "#895159",
    bg: "rgba(137,81,89,.06)",
    border: "rgba(137,81,89,.12)",
    badgeBg: "rgba(137,81,89,.14)",
    badgeText: "#895159",
  },
  important_not_urgent: {
    label: "Schedule",
    subtitle: "Important, Not Urgent",
    emoji: "🔷",
    color: "#374375",
    bg: "rgba(186,189,226,.14)",
    border: "rgba(186,189,226,.28)",
    badgeBg: "rgba(186,189,226,.28)",
    badgeText: "#374375",
  },
  urgent_not_important: {
    label: "Delegate",
    subtitle: "Urgent, Not Important",
    emoji: "🍑",
    color: "#895159",
    bg: "rgba(225,174,161,.12)",
    border: "rgba(225,174,161,.28)",
    badgeBg: "rgba(225,174,161,.30)",
    badgeText: "#895159",
  },
  neither: {
    label: "Eliminate",
    subtitle: "Not Urgent or Important",
    emoji: "⚪",
    color: "rgba(55,67,117,.60)",
    bg: "rgba(55,67,117,.05)",
    border: "rgba(55,67,117,.10)",
    badgeBg: "rgba(55,67,117,.10)",
    badgeText: "rgba(55,67,117,.75)",
  },
};

export const QUADRANT_ORDER: Quadrant[] = [
  "urgent_important",
  "important_not_urgent",
  "urgent_not_important",
  "neither",
];
