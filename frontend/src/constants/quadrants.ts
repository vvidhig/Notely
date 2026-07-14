import type { Quadrant } from "../types";
import type { LucideIcon } from "lucide-react";
import { Flame, CalendarClock, Users, CircleDashed } from "lucide-react";

export interface QuadrantConfig {
  label: string;
  subtitle: string;
  icon: LucideIcon;
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
    icon: Flame,
    color: "#111111",
    bg: "rgba(17,17,17,.06)",
    border: "rgba(17,17,17,.12)",
    badgeBg: "rgba(17,17,17,.14)",
    badgeText: "#111111",
  },
  important_not_urgent: {
    label: "Schedule",
    subtitle: "Important, Not Urgent",
    icon: CalendarClock,
    color: "#111111",
    bg: "rgba(17,17,17,.14)",
    border: "rgba(17,17,17,.28)",
    badgeBg: "rgba(17,17,17,.28)",
    badgeText: "#111111",
  },
  urgent_not_important: {
    label: "Delegate",
    subtitle: "Urgent, Not Important",
    icon: Users,
    color: "#111111",
    bg: "rgba(17,17,17,.12)",
    border: "rgba(17,17,17,.28)",
    badgeBg: "rgba(17,17,17,.10)",
    badgeText: "#111111",
  },
  neither: {
    label: "Eliminate",
    subtitle: "Not Urgent or Important",
    icon: CircleDashed,
    color: "rgba(17,17,17,.60)",
    bg: "rgba(17,17,17,.05)",
    border: "rgba(17,17,17,.10)",
    badgeBg: "rgba(17,17,17,.10)",
    badgeText: "rgba(17,17,17,.75)",
  },
};

export const QUADRANT_ORDER: Quadrant[] = [
  "urgent_important",
  "important_not_urgent",
  "urgent_not_important",
  "neither",
];
