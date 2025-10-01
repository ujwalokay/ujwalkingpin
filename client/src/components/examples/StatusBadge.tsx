import { StatusBadge } from '../StatusBadge';

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-4 p-6">
      <StatusBadge status="available" />
      <StatusBadge status="running" />
      <StatusBadge status="expired" />
      <StatusBadge status="upcoming" />
    </div>
  );
}
