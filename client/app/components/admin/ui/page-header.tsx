interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl tracking-wide text-white">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{description}</p>}
      </div>
      {action && <div className="flex max-w-full shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
