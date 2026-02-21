import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Emergency } from "@/data/mockData";
import { fetchAllSessions, resolveSession } from "@/lib/api";
import { socket } from "@/lib/socket";
import { sessionToEmergency, type BackendSession } from "@/lib/sessionToEmergency";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TopStatsBar from "@/components/dashboard/TopStatsBar";
import EmergencyList from "@/components/dashboard/EmergencyList";
import EmergencyDetail from "@/components/dashboard/EmergencyDetail";
import MapView from "@/components/dashboard/MapView";

const sortBySeverity = (arr: Emergency[]) =>
  [...arr].sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return (order[b.priority] ?? 0) - (order[a.priority] ?? 0);
  });

const Index = () => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateFromSessions = useCallback((sessions: BackendSession[]) => {
    const mapped = sessions.map(sessionToEmergency);
    setEmergencies(sortBySeverity(mapped));
    setSelectedId((prev) => {
      if (!prev || !mapped.some((e) => e.id === prev)) return mapped[0]?.id ?? null;
      return prev;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchAllSessions()
      .then((data: BackendSession[]) => {
        if (mounted) {
          updateFromSessions(data ?? []);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load emergencies");
          setEmergencies([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    socket.on("new_sos", (session: BackendSession) => {
      if (mounted) {
        setEmergencies((prev) => sortBySeverity([...prev, sessionToEmergency(session)]));
      }
    });

    socket.on("session_update", (session: BackendSession) => {
      if (mounted) {
        setEmergencies((prev) =>
          sortBySeverity(
            prev.map((e) => (e.id === session.sessionId ? sessionToEmergency(session) : e))
          )
        );
      }
    });

    socket.on("tamper_alert", ({ sessionId }: { sessionId: string }) => {
      if (mounted) {
        setEmergencies((prev) =>
          sortBySeverity(
            prev.map((e) =>
              e.id === sessionId ? { ...e, connection: "offline" as const, signal: "None" } : e
            )
          )
        );
      }
    });

    socket.on("session_resolved", ({ sessionId }: { sessionId: string }) => {
      if (mounted) {
        setEmergencies((prev) => prev.filter((e) => e.id !== sessionId));
        setSelectedId((prev) => (prev === sessionId ? null : prev));
      }
    });

    return () => {
      mounted = false;
      socket.off("new_sos");
      socket.off("session_update");
      socket.off("tamper_alert");
      socket.off("session_resolved");
    };
  }, [updateFromSessions]);

  const selectedEmergency = emergencies.find((e) => e.id === selectedId) ?? null;

  const handleResolve = async (sessionId: string) => {
    try {
      await resolveSession(sessionId);
      setEmergencies((prev) => prev.filter((e) => e.id !== sessionId));
      setSelectedId((prev) => (prev === sessionId ? null : prev));
      toast.success("Emergency marked as resolved");
    } catch (err) {
      console.error("Resolve failed:", err);
      toast.error("Failed to resolve. Is the backend running?");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <DashboardHeader />

      <div className="p-4 border-b border-border">
        <TopStatsBar emergencies={emergencies} loading={loading} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Emergency List */}
        <div className="w-80 shrink-0 border-r border-border p-4 flex flex-col overflow-hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Emergencies
          </h2>
          {error ? (
            <div className="text-sm text-destructive py-4">{error}</div>
          ) : (
            <EmergencyList
              emergencies={emergencies}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
            />
          )}
        </div>

        {/* Center: Map */}
        <div className="flex-1 p-4 flex flex-col min-w-0">
          <MapView emergency={selectedEmergency} />
        </div>

        {/* Right: Detail Panel */}
        <div className="w-[420px] shrink-0 border-l border-border p-4 overflow-hidden flex flex-col">
          {selectedEmergency ? (
            <EmergencyDetail emergency={selectedEmergency} onResolve={handleResolve} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {loading ? "Loading..." : "Select an emergency to view details"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
