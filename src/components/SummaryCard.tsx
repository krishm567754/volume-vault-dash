import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'default';
}

export const SummaryCard = ({ title, value, icon: Icon, trend, variant = 'default' }: SummaryCardProps) => {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
    secondary: 'bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20',
    success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
    default: 'bg-card',
  };

  const iconVariantStyles = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-success text-success-foreground',
    default: 'bg-muted text-foreground',
  };

  return (
    <Card className={`p-6 shadow-md hover:shadow-lg transition-all duration-300 border ${variantStyles[variant]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconVariantStyles[variant]} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};
