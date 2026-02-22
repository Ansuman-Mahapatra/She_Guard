import { useEffect, useState, useCallback } from "react";
import { MapPin, Crosshair, Car, RefreshCw, Thermometer, AlertTriangle, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Emergency } from "@/data/mockData";
import { getMapsUrl } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/** Distance in meters (Haversine approx). */
function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

const myLocationIcon = new L.DivIcon({
  className: "bg-transparent",
  html: `<div class="relative flex items-center justify-center w-10 h-10">
           <div class="absolute w-full h-full bg-primary/30 rounded-full animate-pulse"></div>
           <div class="absolute w-5 h-5 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
             <span class="text-white text-[10px] font-bold">You</span>
           </div>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface MapViewProps {
  emergency: Emergency | null;
}

/** Fits map bounds to include both user location and victim when user location is available. */
function FitBounds({ userLoc, victimLat, victimLng }: { userLoc: { lat: number; lng: number } | null; victimLat: number; victimLng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!userLoc) return;
    const bounds = L.latLngBounds(
      [userLoc.lat, userLoc.lng],
      [victimLat, victimLng]
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [map, userLoc, victimLat, victimLng]);
  return null;
}

interface MapComponentProps {
  emergency: Emergency;
  refreshMyLocation?: number;
}

const MapComponent = ({ emergency, refreshMyLocation = 0 }: MapComponentProps) => {
  const isResolved = emergency.status === "resolved";
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    fetchMyLocation();
  }, [fetchMyLocation, refreshMyLocation]);

  const victimLat = emergency.currentLocation.lat;
  const victimLng = emergency.currentLocation.lng;
  const distanceM = userLocation ? haversineMeters(userLocation.lat, userLocation.lng, victimLat, victimLng) : null;
  const distanceKm = distanceM != null ? (distanceM / 1000).toFixed(1) : null;

  return (
    <MapContainer
      center={[victimLat, victimLng]}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      className={`z-0 ${isResolved ? "grayscale" : ""}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds userLoc={userLocation} victimLat={victimLat} victimLng={victimLng} />
      {/* Direction line from my location to victim */}
      {userLocation && (
        <>
          <Polyline
            positions={[[userLocation.lat, userLocation.lng], [victimLat, victimLng]]}
            pathOptions={{
              color: "hsl(var(--primary))",
              weight: 4,
              opacity: 0.8,
              dashArray: "8 6",
            }}
          />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={myLocationIcon}>
            <Popup>
              <p className="font-bold text-sm">My Location (PCR)</p>
              {distanceKm != null && (
                <p className="text-muted-foreground text-xs mt-1">→ Victim: {distanceKm} km</p>
              )}
            </Popup>
          </Marker>
        </>
      )}
      <Marker position={[victimLat, victimLng]} icon={isResolved ? resolvedIcon : victimIcon}>
        <Popup className="rounded-lg shadow-lg">
          <div className="text-center font-sans tracking-tight">
            <p className="font-bold text-sm mb-0.5">{emergency.victim.name}</p>
            <p className="text-muted-foreground text-[11px] mb-2 uppercase tracking-wide font-semibold">{emergency.type}</p>
            {distanceKm != null && (
              <p className="text-xs text-muted-foreground mb-2">Distance from you: {distanceKm} km</p>
            )}
            {!isResolved ? (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-[11px] w-full"
                onClick={() => window.open(getMapsUrl(victimLat, victimLng), "_blank")}
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
          center={[victimLat, victimLng]}
          radius={150}
          pathOptions={{ color: "hsl(var(--danger))", fillColor: "hsl(var(--danger))", fillOpacity: 0.08, weight: 1.5, dashArray: "4 4" }}
        />
      )}
    </MapContainer>
  );
};

const MapView = ({ emergency }: MapViewProps) => {
  const [refreshMyLocation, setRefreshMyLocation] = useState(0);
  return (
    <div className="rounded-xl border border-border bg-card h-full flex flex-col overflow-hidden">
      {/* Map area */}
      <div className="flex-1 relative bg-background/5 flex flex-col min-h-[200px] z-0">
        {emergency ? (
          <MapComponent emergency={emergency} key={emergency.id} refreshMyLocation={refreshMyLocation} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center flex-col z-10 text-muted-foreground bg-background/50">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">Select an emergency to view on live map</p>
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="flex items-center gap-2 p-3 border-t border-border bg-background flex-wrap z-10 relative">
        <Button size="sm" variant="outline" className="h-7 text-[11px] border-border bg-muted/20 text-muted-foreground hover:text-foreground" onClick={() => setRefreshMyLocation((n) => n + 1)}>
          <Crosshair className="h-3.5 w-3.5 mr-1" /> My Location
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
