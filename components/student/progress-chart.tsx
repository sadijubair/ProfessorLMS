type ProgressChartItem = {
  label: string;
  value: number;
};

export function ProgressChart({
  data,
  suffix = '',
}: {
  data: ProgressChartItem[];
  suffix?: string;
}) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="text-muted-foreground">
              {item.value}
              {suffix}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
