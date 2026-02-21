import { useState } from "react";
import type { Emergency } from "@/data/mockData";
import EmergencyCard from "./EmergencyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface EmergencyListProps {
  emergencies: Emergency[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

type FilterStatus = "all" | "active" | "resolved";

const EmergencyList = ({ emergencies, selectedId, onSelect, loading }: EmergencyListProps) => {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = emergencies.filter((e) => {
    if (filter === "active" && e.status !== "active") return false;
    if (filter === "resolved" && e.status !== "resolved") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.victim.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading emergencies...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search emergencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 bg-muted/50 border-border text-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3">
        {(["all", "active", "resolved"] as FilterStatus[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className={`h-7 text-xs capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {f === "all"
              ? `All (${emergencies.length})`
              : `${f} (${emergencies.filter((e) => e.status === f).length})`}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
        {filtered.map((emergency) => (
          <EmergencyCard
            key={emergency.id}
            emergency={emergency}
            isSelected={selectedId === emergency.id}
            onSelect={onSelect}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No emergencies found.
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyList;
