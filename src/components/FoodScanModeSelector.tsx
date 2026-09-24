import { Camera, Scale, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScanMode = "quick" | "detailed";

interface FoodScanModeSelectorProps {
  value: ScanMode;
  onChange: (mode: ScanMode) => void;
}

export const FoodScanModeSelector = ({ value, onChange }: FoodScanModeSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <button
        onClick={() => onChange("quick")}
        className={cn(
          "rounded-3xl border p-4 text-left transition-all duration-500 space-y-2",
          value === "quick"
            ? "border-sage bg-sage/10 shadow-soft"
            : "border-border hover:border-sage/50 hover:bg-muted"
        )}
      >
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          value === "quick" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Quick Scan</p>
          <p className="text-xs text-muted-foreground">Best for packaged food</p>
        </div>
      </button>

      <button
        onClick={() => onChange("detailed")}
        className={cn(
          "rounded-3xl border p-4 text-left transition-all duration-500 space-y-2",
          value === "detailed"
            ? "border-sage bg-sage/10 shadow-soft"
            : "border-border hover:border-sage/50 hover:bg-muted"
        )}
      >
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          value === "detailed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Detailed Log</p>
          <p className="text-xs text-muted-foreground">Log weight & quantity</p>
        </div>
      </button>
    </div>
  );
};
