import type { Emergency } from "@/data/mockData";
import { getReportUrl, getMapsUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Phone, Mail, Battery, Wifi, WifiOff, Clock, Navigation,
  Play, Pause, Download, Eye, FileText, Plus, Car, User, Shield,
  CheckCircle, XCircle, Printer, ChevronRight
} from "lucide-react";

interface EmergencyDetailProps {
  emergency: Emergency;
  onResolve?: (sessionId: string) => void;
}

const EmergencyDetail = ({ emergency, onResolve }: EmergencyDetailProps) => {
  const e = emergency;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{e.victim.name}</h2>
            <Badge className={e.status === "active" ? "bg-danger text-danger-foreground animate-pulse-slow" : "bg-success text-success-foreground"}>
              {e.status === "active" ? "● ACTIVE" : "✓ RESOLVED"}
            </Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">{e.id}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
            onClick={() => window.open(getMapsUrl(e.currentLocation.lat, e.currentLocation.lng), "_blank")}
          >
            <Car className="h-3 w-3 mr-1" /> Open in Maps
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-border bg-muted/30 hover:bg-muted"
            asChild
          >
            <a href={e.victim.phone ? `tel:${e.victim.phone}` : "#"}>
              <Phone className="h-3 w-3 mr-1" /> Call
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-muted/50 border border-border h-8 w-full justify-start gap-0 rounded-lg p-0.5">
          {["overview", "location", "evidence", "guardians", "response", "notes"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="text-xs capitalize h-7 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto scrollbar-thin mt-4">
          {/* Overview */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Victim */}
            <DetailSection title="Victim Details">
              <InfoRow label="Full Name" value={e.victim.name} />
              <InfoRow label="Age" value={`${e.victim.age} years`} />
              <InfoRow
                label="Phone"
                value={e.victim.phone || "—"}
                action={
                  e.victim.phone ? (
                    <a href={`tel:${e.victim.phone}`} className="inline-flex">
                      <Phone className="h-3 w-3 text-info cursor-pointer" />
                    </a>
                  ) : null
                }
              />
              {e.victim.altPhone && <InfoRow label="Alternate" value={e.victim.altPhone} />}
              <InfoRow
                label="Email"
                value={e.victim.email || "—"}
                action={
                  e.victim.email ? (
                    <a href={`mailto:${e.victim.email}`} className="inline-flex">
                      <Mail className="h-3 w-3 text-info cursor-pointer" />
                    </a>
                  ) : null
                }
              />
              <InfoRow label="Address" value={e.victim.address} />
              <InfoRow label="Blood Group" value={e.victim.bloodGroup} />
              {e.victim.medical && <InfoRow label="Medical" value={e.victim.medical} />}
              <InfoRow label="Registered" value={e.victim.registeredDate} />
              <InfoRow label="Previous SOS" value={`${e.victim.previousSOS}`} />
            </DetailSection>

            {/* Emergency */}
            <DetailSection title="Emergency Information">
              <InfoRow label="Type" value={e.type} />
              <InfoRow label="Priority" value={e.priority.toUpperCase()} />
              <InfoRow label="Triggered At" value={e.triggeredAt} />
              <InfoRow label="Battery" value={`${e.battery}%`} action={<Battery className="h-3 w-3" />} />
              <InfoRow label="Connection" value={`${e.connection} (${e.signal})`} action={e.connection === "online" ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3 text-danger" />} />
            </DetailSection>

            {/* Current Location */}
            <DetailSection title="Current Location">
              <InfoRow label="Coordinates" value={`${e.currentLocation.lat.toFixed(4)}°N, ${e.currentLocation.lng.toFixed(4)}°E`} />
              <InfoRow label="Accuracy" value={`±${e.currentLocation.accuracy}m`} />
              <InfoRow label="Speed" value={`${e.currentLocation.speed} km/h`} />
              <InfoRow label="Heading" value={`${e.currentLocation.heading}° (${getDirection(e.currentLocation.heading)})`} />
              <InfoRow label="Last Update" value={e.currentLocation.timestamp} />
            </DetailSection>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location" className="mt-0 space-y-4">
            <DetailSection title="Movement Analysis">
              <InfoRow label="Total Distance" value={`${e.totalDistance} meters`} />
              <InfoRow label="Updates Received" value={`${e.locationHistory.length}`} />
              <InfoRow label="Pattern" value={e.currentLocation.speed > 0 ? "Continuous movement" : "Stationary"} />
              <InfoRow label="Direction" value={`${getDirection(e.currentLocation.heading)} consistently`} />
            </DetailSection>

            <DetailSection title="Location History">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3">Time</th>
                      <th className="text-left py-2 pr-3">Location</th>
                      <th className="text-left py-2 pr-3">Accuracy</th>
                      <th className="text-left py-2">Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.locationHistory.slice().reverse().map((loc, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 pr-3 font-mono text-muted-foreground">{loc.timestamp}</td>
                        <td className="py-1.5 pr-3 font-mono">{loc.lat.toFixed(4)}°N</td>
                        <td className="py-1.5 pr-3">±{loc.accuracy}m</td>
                        <td className="py-1.5">{loc.speed} km/h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DetailSection>

            {/* Map placeholder */}
            <div className="rounded-lg border border-border bg-muted/30 h-48 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Map View</p>
                <p className="text-xs">Live tracking visualization</p>
              </div>
            </div>
          </TabsContent>

          {/* Evidence */}
          <TabsContent value="evidence" className="mt-0 space-y-3">
            {e.evidence.map((ev) => (
              <div key={ev.id} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ev.type === "audio" ? "🎤" : ev.type === "photo" ? "📷" : "🎥"}</span>
                    <div>
                      <p className="text-sm font-medium">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">{ev.capturedAt}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{ev.size}</span>
                </div>
                {ev.type === "audio" && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Duration: {ev.duration}</span>
                      {ev.ongoing && <Badge className="bg-danger text-danger-foreground text-[10px] h-4">● LIVE</Badge>}
                    </div>
                    {/* Waveform placeholder */}
                    <div className="h-8 bg-muted/50 rounded flex items-center px-2 gap-[2px]">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary/60 rounded-full"
                          style={{ height: `${Math.random() * 100}%`, minHeight: 2 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {ev.type === "photo" && (
                  <div className="mt-2 h-24 bg-muted/30 rounded border border-border/50 flex items-center justify-center overflow-hidden">
                    {ev.url ? (
                      <img src={ev.url} alt={ev.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Photo evidence preview</span>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {ev.type === "audio" && (
                    <>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30"><Play className="h-3 w-3 mr-1" /> Play</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30"><Pause className="h-3 w-3 mr-1" /> Pause</Button>
                    </>
                  )}
                  {ev.type === "photo" && ev.url && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30" onClick={() => window.open(ev.url, "_blank")}><Eye className="h-3 w-3 mr-1" /> View</Button>
                  )}
                  {ev.type === "photo" && ev.url && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30" asChild>
                      <a href={ev.url} download target="_blank" rel="noreferrer"><Download className="h-3 w-3 mr-1" /> Download</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {e.evidence.filter((ev) => ev.url).length > 0 && (
              <Button
                variant="outline"
                className="w-full h-8 text-xs border-border bg-muted/20"
                onClick={() => e.evidence.filter((ev) => ev.url).forEach((ev) => window.open(ev.url, "_blank"))}
              >
                <Download className="h-3 w-3 mr-1" /> Open All Evidence
              </Button>
            )}
            {e.evidence.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">No evidence files.</div>
            )}
          </TabsContent>

          {/* Guardians */}
          <TabsContent value="guardians" className="mt-0 space-y-3">
            {e.guardians.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">No guardians linked.</div>
            ) : e.guardians.map((g, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.relation}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${g.tracking ? "border-success/50 text-success" : "border-muted-foreground/50 text-muted-foreground"}`}>
                    {g.tracking ? "● Tracking" : "○ Offline"}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>📱 {g.phone} — SMS: {g.smsStatus}</p>
                  {g.email && <p>✉️ {g.email} — Email: {g.emailStatus || "N/A"}</p>}
                </div>
                <div className="flex gap-2 mt-2">
                  {g.phone && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30" asChild>
                      <a href={`tel:${g.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                    </Button>
                  )}
                  {g.email && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30" asChild>
                      <a href={`mailto:${g.email}`}><Mail className="h-3 w-3 mr-1" /> Email</a>
                    </Button>
                  )}
                  {g.phone && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30" asChild>
                      <a href={`sms:${g.phone}`}><Mail className="h-3 w-3 mr-1" /> SMS</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Response */}
          <TabsContent value="response" className="mt-0 space-y-4">
            {e.assignedUnits.length > 0 && (
              <DetailSection title="Assigned Units">
                {e.assignedUnits.map((u) => (
                  <div key={u.id} className="rounded-lg border border-border bg-muted/20 p-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold flex items-center gap-1">🚔 {u.unitName}</p>
                      <Badge className={`text-[10px] ${u.status === "en-route" ? "bg-info/20 text-info" : u.status === "arrived" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                        {u.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Officers: {u.officers.join(", ")}</p>
                      <p>Distance: {u.distance} | ETA: {u.eta}</p>
                      {u.speed && <p>Speed: {u.speed}</p>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30"><Phone className="h-3 w-3 mr-1" /> Call Unit</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] border-border bg-muted/30"><MapPin className="h-3 w-3 mr-1" /> Track</Button>
                    </div>
                  </div>
                ))}
              </DetailSection>
            )}

            {e.backupUnits.length > 0 && (
              <DetailSection title="Backup Units">
                {e.backupUnits.map((u) => (
                  <div key={u.id} className="text-xs text-muted-foreground border border-border/50 rounded p-2">
                    🚔 {u.unitName} — {u.distance} away, ETA {u.eta}
                  </div>
                ))}
              </DetailSection>
            )}

            <DetailSection title="Response Timeline">
              <div className="relative pl-4 border-l border-border/50 space-y-3">
                {e.responseLog.map((log, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-info border-2 border-background" />
                    <p className="text-xs">
                      <span className="font-mono text-muted-foreground mr-2">{log.time}</span>
                      {log.message}
                    </p>
                  </div>
                ))}
              </div>
            </DetailSection>

            <div className="flex gap-2">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
                <Car className="h-3 w-3 mr-1" /> Dispatch More Units
              </Button>
            </div>
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="mt-0 space-y-3">
            {e.notes.map((n, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{n.time}</span>
                  <span className="text-xs font-medium text-info">{n.officer}</span>
                </div>
                <p className="text-sm">{n.note}</p>
              </div>
            ))}
            {e.notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>}
            <Button size="sm" variant="outline" className="w-full h-8 text-xs border-border bg-muted/20">
              <Plus className="h-3 w-3 mr-1" /> Add Note
            </Button>
          </TabsContent>
        </div>
      </Tabs>

      {/* Action Bar */}
      {e.status === "active" && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border mt-4">
          <Button
            size="sm"
            className="bg-success text-success-foreground hover:bg-success/90 h-7 text-xs"
            onClick={() => onResolve?.(e.id)}
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Mark Resolved
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            onClick={() => onResolve?.(e.id)}
          >
            <XCircle className="h-3 w-3 mr-1" /> False Alarm
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            onClick={() => window.open(getReportUrl(e.id), "_blank")}
          >
            <FileText className="h-3 w-3 mr-1" /> Export Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            onClick={() => window.print()}
          >
            <Printer className="h-3 w-3 mr-1" /> Print
          </Button>
        </div>
      )}
    </div>
  );
};

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium text-right">
        {value} {action}
      </span>
    </div>
  );
}

function getDirection(heading: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(heading / 45) % 8];
}

export default EmergencyDetail;
