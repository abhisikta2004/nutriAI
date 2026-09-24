import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Footprints, 
  Heart, 
  Activity, 
  RefreshCw, 
  ArrowUpRight, 
  Clock, 
  PlusCircle, 
  Smartphone,
  ExternalLink
} from "lucide-react";
import { useAppleHealth } from "@/contexts/AppleHealthContext";
import { AppleHealthRings } from "./AppleHealthRings";
import { AppleHealthModal } from "./AppleHealthModal";

export const AppleHealthCard: React.FC = () => {
  const { syncState, summary, lastSyncedText } = useAppleHealth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeBurn = syncState.activity.activeEnergyBurned || 0;
  const steps = syncState.activity.stepCount || 0;
  const heartRate = syncState.activity.restingHeartRate || 64;
  
  const targetCals = summary.dailyTargetCalories || 2000;
  const consumedCals = summary.totalCaloriesConsumed || 0;
  const remainingCals = summary.remainingCalories;
  const netCals = summary.netCalories;

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-card via-card/95 to-red-500/5 border border-border/60 shadow-elevated hover:shadow-hover transition-all duration-300 relative overflow-hidden">
        {/* Subtle Ambient Apple Red Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Header and Rings */}
          <div className="flex items-center gap-5 flex-1">
            <div className="shrink-0 cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <AppleHealthRings
                moveValue={activeBurn}
                moveTarget={500}
                intakeValue={consumedCals}
                intakeTarget={targetCals}
                proteinValue={summary.totalProteinConsumed}
                proteinTarget={summary.dailyTargetProtein}
                size={140}
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🍎</span>
                  <h3 className="text-lg font-bold text-foreground">Apple Health</h3>
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last synced: {lastSyncedText}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Move: {summary.moveProgress}% • Intake: {summary.intakeProgress}% • Protein: {summary.proteinProgress}%
              </p>

              {/* Quick Metrics Badges */}
              <div className="flex items-center gap-3 pt-1 flex-wrap text-xs font-medium">
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                  <Flame className="h-3.5 w-3.5 shrink-0" />
                  <span>{activeBurn} kcal Move</span>
                </div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  <Footprints className="h-3.5 w-3.5 shrink-0" />
                  <span>{steps.toLocaleString()} steps</span>
                </div>
                <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md">
                  <Heart className="h-3.5 w-3.5 shrink-0" />
                  <span>{heartRate} bpm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Daily Calorie Allowance & Action */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/40">
            <div className="space-y-1 lg:text-right">
              <div className="flex items-baseline gap-1.5 lg:justify-end">
                <span className="text-2xl font-black text-foreground">
                  {consumedCals}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  / {targetCals} kcal Target
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Net Calories: <strong className={netCals > 0 ? "text-foreground" : "text-emerald-600"}>{netCals} kcal</strong> ({remainingCals} kcal remaining)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-semibold border-border/70 hover:bg-muted flex items-center gap-1.5 shadow-sm"
              >
                <Activity className="h-3.5 w-3.5 text-primary" />
                Apple Health Center
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AppleHealthModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};
