import { cn } from "@/lib/utils";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card p-8 text-center",
        className
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        {Icon ? (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
        ) : null}

        {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}

        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}

        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </div>
  );
}