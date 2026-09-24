import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Flame, 
  Footprints, 
  Activity, 
  Smartphone, 
  Sparkles, 
  Clock,
  Zap,
  CheckCircle2,
  Copy,
  Info,
  Utensils
} from "lucide-react";
import { useAppleHealth } from "@/contexts/AppleHealthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AppleHealthRings } from "./AppleHealthRings";
import { toast } from "sonner";

interface AppleHealthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppleHealthModal: React.FC<AppleHealthModalProps> = ({ open, onOpenChange }) => {
  const { 
    syncState, 
    summary, 
    lastSyncedText,
    syncActivityData, 
    generateShortcutLink 
  } = useAppleHealth();
  const { profile } = useUserProfile();

  const activeBurn = syncState.activity.activeEnergyBurned || 0;
  const steps = syncState.activity.stepCount || 0;

  const copyShortcutLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://nutri-ai.vercel.app";
    const url = `${origin}/?health_sync=1&kcal=500&steps=10000`;
    navigator.clipboard.writeText(url);
    toast.success("iOS Shortcut Sync URL copied! 📋", {
      description: "Format: /?health_sync=1&kcal=[Active Energy]&steps=[Step Count]"
    });
  };

  const handleTestShortcutSync = () => {
    syncActivityData({
      activeEnergyBurned: 520,
      stepCount: 8500,
    }, "shortcut");
    toast.success("Apple Health synced via iOS Shortcut! 🍎", {
      description: "Active Calories: 520 kcal • Steps: 8,500 synced."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🍎</span>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Apple Health & Shortcuts Sync
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Syncs your Apple Watch active calories (Move) and daily steps.
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1.5 font-semibold">
              <Clock className="h-3 w-3" />
              Synced {lastSyncedText}
            </Badge>
          </div>
        </DialogHeader>

        {/* Concentric Activity Rings & Live Progress */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-5 bg-muted/20 rounded-2xl border border-border/50">
          <AppleHealthRings
            moveValue={activeBurn}
            moveTarget={500}
            intakeValue={summary.totalCaloriesConsumed}
            intakeTarget={summary.dailyTargetCalories}
            proteinValue={summary.totalProteinConsumed}
            proteinTarget={summary.dailyTargetProtein}
            size={150}
          />

          <div className="space-y-2.5 text-center sm:text-left flex-1">
            <div>
              <h4 className="text-base font-bold text-foreground">Today's Health Activity</h4>
              <p className="text-xs text-muted-foreground">
                Move: {summary.moveProgress}% • Intake: {summary.intakeProgress}% • Protein: {summary.proteinProgress}%
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-medium text-red-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FA114F]" />
                  Move (Active Burn):
                </span>
                <strong className="text-foreground">{activeBurn} / 500 kcal</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-medium text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
                  Steps Today:
                </span>
                <strong className="text-foreground">{steps.toLocaleString()} steps</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-medium text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                  Dietary Intake:
                </span>
                <strong className="text-foreground">{summary.totalCaloriesConsumed} / {summary.dailyTargetCalories} kcal</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Item Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Card className="p-3 bg-card/60 text-center space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Flame className="h-3 w-3 text-red-500" /> Active Burn
            </p>
            <p className="text-base font-bold text-foreground">{activeBurn} kcal</p>
          </Card>

          <Card className="p-3 bg-card/60 text-center space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Footprints className="h-3 w-3 text-amber-500" /> Steps
            </p>
            <p className="text-base font-bold text-foreground">{steps.toLocaleString()}</p>
          </Card>

          <Card className="p-3 bg-card/60 text-center space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-500" /> Consumed
            </p>
            <p className="text-base font-bold text-foreground">{summary.totalCaloriesConsumed} kcal</p>
          </Card>

          <Card className="p-3 bg-card/60 text-center space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
              <Activity className="h-3 w-3 text-primary" /> Net
            </p>
            <p className="text-base font-bold text-foreground">{summary.netCalories} kcal</p>
          </Card>
        </div>

        {/* iOS Shortcuts Sync Bridge (The Only Sync Method) */}
        <Card className="p-5 bg-gradient-to-br from-card via-card/95 to-primary/5 border border-border/70 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                1-Tap iOS Shortcut Sync
              </h4>
              <p className="text-xs text-muted-foreground">
                Reads Active Energy Burned & Step Count from Apple HealthKit and syncs instantly.
              </p>
            </div>
          </div>

          {/* Simple 3-step guide */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-2 text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Quick iOS Shortcut Setup (30 Seconds):
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Open <strong>Shortcuts</strong> on iPhone $\rightarrow$ Create New Shortcut.</li>
              <li>Add <strong>Find Health Samples</strong> (Active Energy Burned, Sum) and (Step Count, Sum).</li>
              <li>Add <strong>Open URL</strong> with:
                <div className="mt-1 p-2 rounded-lg bg-background border border-border/60 font-mono text-[11px] text-primary break-all select-all">
                  {`${typeof window !== "undefined" ? window.location.origin : "https://nutri-ai.vercel.app"}/?health_sync=1&kcal=[Active Energy]&steps=[Step Count]`}
                </div>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Button size="sm" onClick={copyShortcutLink} className="text-xs font-semibold gap-1.5 shadow-sm">
              <Copy className="h-3.5 w-3.5" />
              Copy Shortcut URL
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleTestShortcutSync} 
              className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              Test Sync (520 kcal, 8.5k steps)
            </Button>
          </div>
        </Card>

        {/* Dynamic TDEE Calorie Target Note */}
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Your daily target is dynamically calibrated: Base BMR (1,680 kcal) + Apple Health Burn ({activeBurn} kcal) = <strong>{summary.dailyTargetCalories} kcal target</strong> for your <strong>{profile.targetBodyType?.toUpperCase()}</strong> body goal.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
