import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md', ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  subtitle?: string;
}

export function StatCard({ label, value, icon, iconBg = 'bg-navy-100', trend, subtitle }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          {icon}
        </div>
      </div>
      {trend && (
        <p className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </Card>
  );
}
