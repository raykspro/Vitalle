import { Card } from "@/components/ui/card";

/**
 * @typedef {object} StatCardProps
 * @property {string} title
 * @property {string | number} value
 * @property {import("react").ElementType} [icon]
 */

/**
 * @param {StatCardProps} props
 */
export default function StatCard({ title, value, icon: Icon }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <h4 className="text-2xl font-bold">{value}</h4>
      </div>
      {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
    </Card>
  );
}