import { Shield, Bell, Settings, Radio, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-sm font-bold tracking-wide">POLICE CONTROL ROOM</h1>
            <p className="text-[10px] text-muted-foreground">Bhubaneswar Command Center</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/15 border border-success/30">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] text-success font-medium">CONNECTED</span>
        </div>
        
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border bg-muted/30 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-danger-foreground text-[9px] rounded-full flex items-center justify-center font-bold">3</span>
        </Button>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border bg-muted/30">
          <Radio className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border bg-muted/30">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-tight">Insp. Verma</p>
            <p className="text-[10px] text-muted-foreground">Shift A</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
