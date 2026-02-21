import type { Emergency } from "@/data/mockData";
import { getMapsUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Battery, Wifi, WifiOff, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyCardProps {
  emergency: Emergency;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const typeIcons: Record<string, string> = {
  ASSAULT: "🚨",
  HARASSMENT: "⚠️",
  STALKING: "👁️",
  ACCIDENT: "🚗",
  MEDICAL: "🏥",
  KIDNAPPING: "🆘",
};

const priorityStyles = {
  high: "bg-danger/20 text-danger border-danger/40",
  medium: "bg-warning/20 text-warning border-warning/40",
  low: "bg-success/20 text-success border-success/40",
};

const statusStyles = {
  active: "bg-danger text-danger-foreground",
  resolved: "bg-success text-success-foreground",
  "false-alarm": "bg-muted text-muted-foreground",
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const EmergencyCard = ({ emergency, isSelected, onSelect }: EmergencyCardProps) => {
  return (
    <div
      onClick={() => onSelect(emergency.id)}
      className={`relative cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
        isSelected
          ? "border-primary bg-primary/10 glow-red"
          : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
      } ${emergency.status === "active" && emergency.priority === "high" ? "border-l-4 border-l-danger" : ""}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{typeIcons[emergency.type] || "🚨"}</span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{emergency.victim.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{emergency.id}</p>
          </div>
        </div>
        <Badge className={`shrink-0 text-[10px] ${statusStyles[emergency.status]}`}>
          {emergency.status === "active" ? "● ACTIVE" : emergency.status === "resolved" ? "✓ RESOLVED" : "FALSE ALARM"}
        </Badge>
      </div>

      {/* Type & Priority */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-[10px]">
          {emergency.type}
        </Badge>
        <Badge variant="outline" className={`text-[10px] ${priorityStyles[emergency.priority]}`}>
          {emergency.priority.toUpperCase()}
        </Badge>
      </div>

      {/* Info grid */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-warning" />
          <span>{formatElapsed(emergency.elapsedSeconds)} ago</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-danger" />
          <span className="truncate">
            {emergency.currentLocation.lat.toFixed(4)}°N, {emergency.currentLocation.lng.toFixed(4)}°E
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Battery className="h-3 w-3" />
            <span>{emergency.battery}%</span>
          </div>
          <div className="flex items-center gap-1">
            {emergency.connection === "online" ? (
              <Wifi className="h-3 w-3 text-success" />
            ) : (
              <WifiOff className="h-3 w-3 text-danger" />
            )}
            <span>{emergency.signal}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {emergency.status === "active" && (
        <div className="flex gap-2 mt-3" onClick={(ev) => ev.stopPropagation()}>
          {emergency.victim.phone && (
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1 border-border bg-muted/50 hover:bg-primary/20 hover:text-primary" asChild>
              <a href={`tel:${emergency.victim.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs flex-1 border-border bg-muted/50 hover:bg-primary/20 hover:text-primary"
            onClick={() => window.open(getMapsUrl(emergency.currentLocation.lat, emergency.currentLocation.lng), "_blank")}
          >
            <MapPin className="h-3 w-3 mr-1" /> Maps
          </Button>
        </div>
      )}

      {/* Evidence / Guardian count */}
      <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
        <span>🎤 {emergency.evidence.filter(e => e.type === "audio").length} audio</span>
        <span>📷 {emergency.evidence.filter(e => e.type === "photo").length} photos</span>
        <span>👥 {emergency.guardians.length} guardians</span>
      </div>
    </div>
  );
};

export default EmergencyCard;
