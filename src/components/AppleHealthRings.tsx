import React from "react";

interface AppleHealthRingsProps {
  moveValue: number;      // Active Calories Burned
  moveTarget: number;     // Active Calorie Target (e.g. 500 kcal)
  intakeValue: number;    // Consumed Calories
  intakeTarget: number;   // Daily Calorie Budget (e.g. 2200 kcal)
  proteinValue: number;   // Consumed Protein (g)
  proteinTarget: number;  // Protein Target (g)
  size?: number;
}

export const AppleHealthRings: React.FC<AppleHealthRingsProps> = ({
  moveValue,
  moveTarget,
  intakeValue,
  intakeTarget,
  proteinValue,
  proteinTarget,
  size = 180
}) => {
  const center = size / 2;
  const strokeWidth = Math.max(8, Math.round(size / 14));
  const gap = 3;

  // Outer Ring: Move (Active Energy Burned) - Red / Coral
  const radius1 = center - strokeWidth / 2 - 4;
  const circ1 = 2 * Math.PI * radius1;
  const pct1 = moveTarget > 0 && moveValue > 0 ? Math.min(1.5, moveValue / moveTarget) : 0;
  const offset1 = circ1 - Math.min(1, pct1) * circ1;

  // Middle Ring: Intake (Consumed Calories) - Orange / Amber
  const radius2 = radius1 - strokeWidth - gap;
  const circ2 = 2 * Math.PI * radius2;
  const pct2 = intakeTarget > 0 && intakeValue > 0 ? Math.min(1.5, intakeValue / intakeTarget) : 0;
  const offset2 = circ2 - Math.min(1, pct2) * circ2;

  // Inner Ring: Protein Target - Emerald / Green
  const radius3 = radius2 - strokeWidth - gap;
  const circ3 = 2 * Math.PI * radius3;
  const pct3 = proteinTarget > 0 && proteinValue > 0 ? Math.min(1.5, proteinValue / proteinTarget) : 0;
  const offset3 = circ3 - Math.min(1, pct3) * circ3;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="ringMoveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FA114F" />
            <stop offset="100%" stopColor="#FF5277" />
          </linearGradient>
          <linearGradient id="ringIntakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#FFCC00" />
          </linearGradient>
          <linearGradient id="ringProteinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#30D158" />
            <stop offset="100%" stopColor="#63E6E2" />
          </linearGradient>

          {/* Shadow filters for Apple Health ring depth */}
          <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Ring Background (Move) */}
        <circle
          cx={center}
          cy={center}
          r={radius1}
          fill="none"
          stroke="#FA114F"
          strokeOpacity="0.18"
          strokeWidth={strokeWidth}
        />
        {/* Outer Ring Progress (Move) */}
        {pct1 > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius1}
            fill="none"
            stroke="url(#ringMoveGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ1}
            strokeDashoffset={offset1}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Middle Ring Background (Intake) */}
        <circle
          cx={center}
          cy={center}
          r={radius2}
          fill="none"
          stroke="#FF9500"
          strokeOpacity="0.18"
          strokeWidth={strokeWidth}
        />
        {/* Middle Ring Progress (Intake) */}
        {pct2 > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius2}
            fill="none"
            stroke="url(#ringIntakeGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ2}
            strokeDashoffset={offset2}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Inner Ring Background (Protein) */}
        <circle
          cx={center}
          cy={center}
          r={radius3}
          fill="none"
          stroke="#30D158"
          strokeOpacity="0.18"
          strokeWidth={strokeWidth}
        />
        {/* Inner Ring Progress (Protein) */}
        {pct3 > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius3}
            fill="none"
            stroke="url(#ringProteinGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ3}
            strokeDashoffset={offset3}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>

      {/* Center Apple Icon / Calorie Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl">🍎</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
          Health
        </span>
      </div>
    </div>
  );
};
