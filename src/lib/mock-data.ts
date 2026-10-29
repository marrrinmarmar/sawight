export type DayPoint = {
  day: string;
  value: number;
  status: "free" | "stable" | "limited" | "standby";
};

/** Lollipop-style data for the Energy Production chart. "We" is the highlighted day. */
export const energyProduction: DayPoint[] = [
  { day: "Mo", value: 1180, status: "stable" },
  { day: "Tu", value: 640, status: "limited" },
  { day: "We", value: 2345, status: "free" },
  { day: "Th", value: 980, status: "stable" },
  { day: "Fr", value: 420, status: "limited" },
  { day: "Sa", value: 760, status: "free" },
  { day: "Sn", value: 540, status: "standby" },
];

export const MAX_PRODUCTION = 2600;

export const statusColors: Record<DayPoint["status"], string> = {
  free: "#84cc16",
  stable: "#f97316",
  limited: "#3b82f6",
  standby: "#8a8f3c",
};

export const statusLabels: Record<DayPoint["status"], string> = {
  free: "Free",
  stable: "Stable",
  limited: "Limited",
  standby: "Standby",
};

export type EfficiencySlice = "renewable" | "stored" | "backup";

/** Stacked bar data for the Power Efficiency chart. */
export const powerEfficiency: {
  day: string;
  renewable: number;
  stored: number;
  backup: number;
}[] = [
  { day: "Mo", renewable: 34, stored: 22, backup: 16 },
  { day: "Tu", renewable: 18, stored: 26, backup: 20 },
  { day: "We", renewable: 10, stored: 20, backup: 26 },
  { day: "Th", renewable: 26, stored: 14, backup: 22 },
  { day: "Fr", renewable: 30, stored: 24, backup: 14 },
  { day: "Sa", renewable: 16, stored: 28, backup: 18 },
  { day: "Sn", renewable: 24, stored: 16, backup: 24 },
];

export const efficiencyColors: Record<EfficiencySlice, string> = {
  renewable: "#a3e635",
  stored: "#e4e6e1",
  backup: "#1c1d22",
};

/** Sparkline data for the two hero mini-cards. */
export const heroSparkline = {
  trending: [4, 9, 6, 12, 10, 16, 13, 20],
  smooth: [14, 10, 15, 9, 17, 8, 16, 12],
};

export const kpis = [
  {
    id: "co2",
    value: "1,240",
    unit: "KG CO2",
    label: "Carbon Offset",
    trend: "+1.2%",
    icon: "cloud" as const,
  },
  {
    id: "yield",
    value: "85.4",
    unit: "MWj",
    label: "Energy Yield",
    trend: "+4.8%",
    icon: "zap" as const,
  },
  {
    id: "water",
    value: "4,500",
    unit: "M³",
    label: "Water Saved",
    trend: "+2.1%",
    icon: "droplets" as const,
  },
];

export const heroStats = [
  { value: "24.5KW", label: "CURRENT LOAD" },
  { value: "98.4%", label: "SYSTEM HEALTH" },
];
