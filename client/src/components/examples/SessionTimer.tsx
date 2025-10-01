import { SessionTimer } from '../SessionTimer';

export default function SessionTimerExample() {
  const endTimes = [
    new Date(Date.now() + 30 * 60 * 1000),
    new Date(Date.now() + 3 * 60 * 1000),
    new Date(Date.now() - 5 * 60 * 1000),
  ];

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Normal (30+ mins left)</p>
        <SessionTimer endTime={endTimes[0]} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Expiring (3 mins left)</p>
        <SessionTimer endTime={endTimes[1]} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Expired</p>
        <SessionTimer endTime={endTimes[2]} />
      </div>
    </div>
  );
}
