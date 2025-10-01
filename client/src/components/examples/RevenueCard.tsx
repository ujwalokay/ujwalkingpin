import { RevenueCard } from '../RevenueCard';
import { DollarSign, Users, Clock } from 'lucide-react';

export default function RevenueCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-3 p-6">
      <RevenueCard
        title="Today's Revenue"
        amount={5480}
        trend={12.5}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <RevenueCard
        title="Total Sessions"
        amount={24}
        trend={-3.2}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
      <RevenueCard
        title="Avg Session Time"
        amount={95}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
