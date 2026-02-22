import { useEffect } from "react";
import { MapPin, Crosshair, Car, RefreshCw, Thermometer, AlertTriangle, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Emergency } from "@/data/mockData";
import { getMapsUrl } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Create custom icons to avoid standard leaflet icon path issues in Vite
const victimIcon = new L.DivIcon({
  className: "bg-transparent",
  html: `<div class="relative flex items-center justify-center w-8 h-8">
           <div class="absolute w-full h-full bg-danger/40 rounded-full animate-ping"></div>
           <div class="absolute w-4 h-4 bg-danger rounded-full border-2 border-white shadow-md"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const resolvedIcon = new L.DivIcon({
  className: "bg-transparent",
  html: `<div class="relative flex items-center justify-center w-8 h-8 opacity-60">
           <div class="absolute w-4 h-4 bg-success rounded-full border-2 border-white shadow-md"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapViewProps {
  emergency: Emergency | null;
}

const MapComponent = ({ emergency }: { emergency: Emergency }) => {
  const isResolved = emergency.status === "resolved";

  return (
    <MapContainer 
      center={[emergency.currentLocation.lat, emergency.currentLocation.lng]} 
      zoom={16} 
      style={{ height: "100%", width: "100%" }}
      className={`z-0 ${isResolved ? 'grayscale' : ''}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[emergency.currentLocation.lat, emergency.currentLocation.lng]} icon={isResolved ? resolvedIcon : victimIcon}>
        <Popup className="rounded-lg shadow-lg">
          <div className="text-center font-sans tracking-tight">
            <p className="font-bold text-sm mb-0.5">{emergency.victim.name}</p>
            <p className="text-muted-foreground text-[11px] mb-2 uppercase tracking-wide font-semibold">{emergency.type}</p>
            {!isResolved ? (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-[11px] w-full"
                onClick={() => window.open(getMapsUrl(emergency.currentLocation.lat, emergency.currentLocation.lng), "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Google Maps
              </Button>
            ) : (
               <p className="text-success text-xs font-bold mt-1 mb-1">✓ RESOLVED</p>
            )}
          </div>
        </Popup>
      </Marker>
      {/* Safe radius circle (mocked around victim) */}
      {!isResolved && (
        <Circle 
           center={[emergency.currentLocation.lat, emergency.currentLocation.lng]}
           radius={150}
           pathOptions={{ color: 'hsl(var(--danger))', fillColor: 'hsl(var(--danger))', fillOpacity: 0.08, weight: 1.5, dashArray: '4 4' }}
        />
      )}
    </MapContainer>
  );
};

const MapView = ({ emergency }: MapViewProps) => {
  return (
    <div className="rounded-xl border border-border bg-card h-full flex flex-col overflow-hidden">
      {/* Map area */}
      <div className="flex-1 relative bg-background/5 flex flex-col min-h-[200px] z-0">
        {emergency ? (
          <MapComponent emergency={emergency} key={emergency.id} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center flex-col z-10 text-muted-foreground bg-background/50">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Select an emergency to view on live map</p>
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="flex items-center gap-2 p-3 border-t border-border bg-background flex-wrap z-10 relative">
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-muted/20 text-muted-foreground hover:text-foreground">
          <Crosshair className="h-3.5 w-3.5 mr-1" /> Center
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-muted/20 text-muted-foreground hover:text-foreground">
          <Car className="h-3.5 w-3.5 mr-1" /> All Units
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-muted/20 text-muted-foreground hover:text-foreground" onClick={() => {
           if (emergency) {
              window.open(getMapsUrl(emergency.currentLocation.lat, emergency.currentLocation.lng), "_blank");
           }
        }}>
          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Extend
        </Button>
        <div className="flex-1" /> {/* Spacer */}
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-muted/20 text-muted-foreground hover:text-foreground">
          <Thermometer className="h-3.5 w-3.5 mr-1" /> Heatmap
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-muted/20 text-muted-foreground hover:text-foreground">
          <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Zones
        </Button>
      </div>
    </div>
  );
};

export default MapView;
