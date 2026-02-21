/**
 * SheGuard PCR API client — connects to backend for SOS sessions.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchActiveSessions() {
  const res = await fetch(`${API_URL}/sos/active`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
  return res.json();
}

export async function fetchAllSessions(status?: "all" | "active" | "resolved") {
  const q = status && status !== "all" ? `?status=${status}` : "";
  const res = await fetch(`${API_URL}/sos/sessions${q}`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
  return res.json();
}

export async function resolveSession(sessionId: string) {
  const res = await fetch(`${API_URL}/sos/resolve/${sessionId}`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to resolve: ${res.status}`);
  return res.json();
}

export function getReportUrl(sessionId: string): string {
  return `${API_URL}/sos/report/${sessionId}`;
}

export function getMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
