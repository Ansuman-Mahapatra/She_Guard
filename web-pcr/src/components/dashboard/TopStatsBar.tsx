import { Siren, ShieldAlert, Users, Car, Clock, MapPin } from "lucide-react";
import type { Emergency } from "@/data/mockData";

export interface PoliceStats {
  onDutyOfficers: number;
  availableUnits: number;
  avgResponse: string | number;
  coverage: string | number;
}

interface TopStatsBarProps {
  emergencies: Emergency[];
  loading?: boolean;
  policeStats?: PoliceStats | null;
}

const variantStyles = {
  danger: "bg-danger/15 text-danger border-danger/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-info/15 text-info border-info/30",
  success: "bg-success/15 text-success border-success/30",
};

const TopStatsBar = ({ emergencies, loading, policeStats }: TopStatsBarProps) => {
  const activeCount = emergencies.filter((e) => e.status === "active").length;
  const highPriorityCount = emergencies.filter((e) => e.priority === "high").length;

  const stats = [
    { label: "Active Emergencies", value: loading ? "—" : activeCount, icon: Siren, variant: "danger" as const },
    { label: "High Priority", value: loading ? "—" : highPriorityCount, icon: ShieldAlert, variant: "warning" as const },
    { label: "On Duty Officers", value: policeStats ? policeStats.onDutyOfficers : "—", icon: Users, variant: "info" as const },
    { label: "Available Units", value: policeStats ? policeStats.availableUnits : "—", icon: Car, variant: "success" as const },
    { label: "Avg Response", value: policeStats ? `${policeStats.avgResponse} min` : "— min", icon: Clock, variant: "info" as const },
    { label: "Coverage", value: policeStats ? `${policeStats.coverage}%` : "—%", icon: MapPin, variant: "success" as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${variantStyles[stat.variant]}`}
        >
          <stat.icon className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{stat.value}</p>
            <p className="text-xs opacity-80 truncate">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopStatsBar;
