import { MapPin, Crosshair, Car, RefreshCw, Thermometer, AlertTriangle, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Emergency } from "@/data/mockData";
import { getMapsUrl } from "@/lib/api";

interface MapViewProps {
  emergency: Emergency | null;
}

const MapView = ({ emergency }: MapViewProps) => {
  return (
    <div className="rounded-lg border border-border bg-card h-full flex flex-col overflow-hidden">
      {/* Map placeholder */}
      <div className="flex-1 relative bg-muted/20 flex items-center justify-center min-h-[200px]">
        {/* Grid to simulate map */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(hsl(220 30% 40%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 30% 40%) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        
        {emergency ? (
          <div className="relative z-10 text-center">
            {/* Pulsing dot */}
            <div className="mx-auto mb-3 relative">
              <div className="w-6 h-6 rounded-full bg-danger pulse-dot mx-auto" />
              <div className="w-3 h-3 rounded-full bg-danger absolute top-1.5 left-1/2 -translate-x-1.5" />
            </div>
            <p className="text-sm font-semibold">{emergency.victim.name}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {emergency.currentLocation.lat.toFixed(4)}°N, {emergency.currentLocation.lng.toFixed(4)}°E
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Speed: {emergency.currentLocation.speed} km/h | Heading: {emergency.currentLocation.heading}°
            </p>
            <Button
              size="sm"
              className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
              onClick={() => window.open(getMapsUrl(emergency.currentLocation.lat, emergency.currentLocation.lng), "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" /> Open in Google Maps
            </Button>
            {/* Simulated nearby markers */}
            <div className="mt-4 flex gap-4 justify-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> 2 Police Stations</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> 2 Hospitals</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info inline-block" /> {emergency.assignedUnits.length + emergency.backupUnits.length} Units</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground z-10">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Select an emergency to view on map</p>
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="flex items-center gap-2 p-2 border-t border-border bg-muted/10 flex-wrap">
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-border bg-muted/30 text-muted-foreground hover:text-foreground">
          <Crosshair className="h-3 w-3 mr-1" /> Center
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-border bg-muted/30 text-muted-foreground hover:text-foreground">
          <Car className="h-3 w-3 mr-1" /> All Units
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-border bg-muted/30 text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3 w-3 mr-1" /> Auto-Follow
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-border bg-muted/30 text-muted-foreground hover:text-foreground">
          <Thermometer className="h-3 w-3 mr-1" /> Heatmap
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-border bg-muted/30 text-muted-foreground hover:text-foreground">
          <AlertTriangle className="h-3 w-3 mr-1" /> Zones
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] border-border bg-muted/30 text-muted-foreground hover:text-foreground">
          <Layers className="h-3 w-3 mr-1" /> Traffic
        </Button>
      </div>
    </div>
  );
};

export default MapView;
