import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, trend, color = "primary" }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn("text-xs font-medium", trend > 0 ? "text-green-600" : "text-red-500")}>
              {trend > 0 ? "+" : ""}{trend}% este mês
            </p>
          )}
        </div>
        {Icon && (
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}