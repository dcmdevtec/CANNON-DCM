import { cn } from "@/lib/utils";

interface TransitProgressBarProps {
  progress: number; // 0-100
  elapsedDays: number;
  totalDays: number;
}

const TransitProgressBar = ({ progress, elapsedDays, totalDays }: TransitProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const getBarColor = () => {
    if (clampedProgress < 50) return "bg-blue-500";
    if (clampedProgress < 85) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
        <div
          className={cn("absolute top-0 left-0 h-1.5 rounded-full transition-all duration-500", getBarColor())}
          style={{ width: `${clampedProgress}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow transition-all duration-500",
            getBarColor()
          )}
          style={{ left: `calc(${clampedProgress}% - 8px)` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Día {Math.min(elapsedDays, totalDays)} de {totalDays}
      </div>
    </div>
  );
};

export default TransitProgressBar;