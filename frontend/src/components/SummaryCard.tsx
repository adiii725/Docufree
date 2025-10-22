import { Card } from "./ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  sparklineData?: number[];
}

export function SummaryCard({ title, value, icon, change, sparklineData }: SummaryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground">{title}</p>
          <p className="text-3xl font-medium">{value.toLocaleString()}</p>
          {change && (
            <div className={`flex items-center gap-1 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm">{change.value}%</span>
            </div>
          )}
        </div>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </div>
      {sparklineData && (
        <div className="mt-4 h-8 flex items-end gap-1">
          {sparklineData.map((value, index) => (
            <div
              key={index}
              className="bg-primary/20 rounded-sm flex-1"
              style={{ height: `${(value / Math.max(...sparklineData)) * 100}%` }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}