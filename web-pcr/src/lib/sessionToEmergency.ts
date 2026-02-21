/**
 * Maps backend EmergencySession to frontend Emergency format.
 */

import type { Emergency, LocationPoint, EvidenceFile, ResponseLogEntry } from "@/data/mockData";

export interface BackendSession {
  sessionId: string;
  victimName: string;
  victimDetails?: {
    phone?: string;
    altPhone?: string;
    email?: string;
    address?: string;
    age?: number;
    bloodGroup?: string;
    medical?: string;
    registeredDate?: string;
    previousSOS?: number;
  };
  guardianDetails?: {
    name?: string;
    relation?: string;
    phone?: string;
    email?: string;
  };
  policeEmail?: string;
  contextType?: string;
  status: "ACTIVE" | "RESOLVED";
  riskScore?: number;
  riskLevel?: string;
  tamperDetected?: boolean;
  locations?: Array<{
    lat: number;
    lng: number;
    speed?: number;
    direction?: number;
    audioLevel?: number;
    timestamp?: string | Date;
  }>;
  mediaUrls?: string[];
  startTime?: string | Date;
  endTime?: string | Date;
  timelineEvents?: Array<{ event?: string; timestamp?: string | Date }>;
}

const contextToType: Record<string, Emergency["type"]> = {
  physical_attack: "ASSAULT",
  forced_vehicle: "KIDNAPPING",
  medical: "MEDICAL",
  unsafe: "HARASSMENT",
  unsure: "STALKING",
};

const riskToPriority = (level?: string): "high" | "medium" | "low" => {
  if (level === "CRITICAL" || level === "HIGH") return "high";
  if (level === "MODERATE") return "medium";
  return "low";
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function locToPoint(loc: BackendSession["locations"][0], idx: number): LocationPoint {
  const ts = loc?.timestamp ? new Date(loc.timestamp) : new Date();
  return {
    lat: loc?.lat ?? 0,
    lng: loc?.lng ?? 0,
    accuracy: 15,
    speed: loc?.speed ?? 0,
    heading: loc?.direction ?? 0,
    timestamp: formatTime(ts),
  };
}

export function sessionToEmergency(s: BackendSession): Emergency {
  const locations = s.locations ?? [];
  const lastLoc = locations[locations.length - 1];
  const firstLoc = locations[0];
  const startTime = s.startTime ? new Date(s.startTime) : new Date();
  const elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);

  const locationHistory: LocationPoint[] = locations.map((l, i) => locToPoint(l, i));
  const currentLocation = lastLoc ? locToPoint(lastLoc, -1) : locToPoint({ lat: 0, lng: 0 }, -1);
  const triggerLocation = firstLoc ? locToPoint(firstLoc, 0) : currentLocation;

  const evidence: EvidenceFile[] = (s.mediaUrls ?? []).map((url, i) => ({
    id: `ev-${s.sessionId}-${i}`,
    type: "photo" as const,
    name: `Photo Evidence ${i + 1}`,
    capturedAt: formatTime(new Date()),
    location: currentLocation,
    size: "—",
    url,
  }));

  const responseLog: ResponseLogEntry[] = (s.timelineEvents ?? []).map((e) => ({
    time: e.timestamp ? formatTime(new Date(e.timestamp)) : "—",
    message: e.event ?? "Event",
  }));

  const connection = s.tamperDetected ? "offline" : "online";
  const signal = s.tamperDetected ? "None" : "4G";

  const vd = s.victimDetails ?? {};
  const gd = s.guardianDetails ?? {};
  const guardians = gd.email || gd.phone || gd.name
    ? [{
        name: gd.name ?? "Guardian",
        relation: gd.relation ?? "Parent",
        phone: gd.phone ?? "",
        email: gd.email,
        smsStatus: "delivered" as const,
        emailStatus: "sent" as const,
        tracking: true,
      }]
    : [];

  return {
    id: s.sessionId,
    victim: {
      name: s.victimName,
      age: vd.age ?? 0,
      phone: vd.phone ?? "",
      altPhone: vd.altPhone,
      email: vd.email ?? "",
      address: vd.address ?? "",
      bloodGroup: vd.bloodGroup ?? "",
      medical: vd.medical,
      registeredDate: vd.registeredDate ?? "—",
      previousSOS: vd.previousSOS ?? 0,
    },
    type: contextToType[s.contextType ?? ""] ?? "ASSAULT",
    status: s.status === "ACTIVE" ? "active" : "resolved",
    priority: riskToPriority(s.riskLevel),
    triggeredAt: formatTime(startTime),
    elapsedSeconds,
    triggerLocation,
    currentLocation,
    battery: 100,
    connection,
    signal,
    guardians,
    evidence,
    assignedUnits: [],
    backupUnits: [],
    responseLog,
    notes: [],
    locationHistory,
    totalDistance: 0,
  };
}
