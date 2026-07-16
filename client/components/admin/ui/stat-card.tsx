interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
}: StatCardProps) {
  return (
    <div className="card-hover rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="mt-2 font-display text-3xl tracking-wide text-white">{value}</p>
          {change && (
            <p
              className={`mt-2 text-xs font-medium ${
                changeType === "positive"
                  ? "text-green-400"
                  : changeType === "negative"
                  ? "text-brand-red"
                  : "text-white/50"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white/5 p-3 text-white/50 transition-transform duration-200 hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
}
