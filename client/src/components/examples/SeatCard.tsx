import { SeatCard } from '../SeatCard';

export default function SeatCardExample() {
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <SeatCard
        seatName="PC-1"
        status="available"
      />
      <SeatCard
        seatName="PC-2"
        status="running"
        customerName="John Doe"
        endTime={new Date(Date.now() + 25 * 60 * 1000)}
        onExtend={() => console.log('Extend clicked')}
        onEnd={() => console.log('End clicked')}
      />
      <SeatCard
        seatName="PS5-1"
        status="expired"
        customerName="Jane Smith"
        onEnd={() => console.log('Clear clicked')}
      />
      <SeatCard
        seatName="VR-1"
        status="upcoming"
        customerName="Mike Johnson"
      />
    </div>
  );
}
