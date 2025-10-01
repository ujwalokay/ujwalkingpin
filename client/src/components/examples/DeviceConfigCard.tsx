import { useState } from 'react';
import { DeviceConfigCard } from '../DeviceConfigCard';

export default function DeviceConfigCardExample() {
  const [count, setCount] = useState(5);
  const [seats, setSeats] = useState([
    { name: "PC-1", visible: true },
    { name: "PC-2", visible: true },
    { name: "PC-3", visible: false },
    { name: "PC-4", visible: true },
    { name: "PC-5", visible: true },
  ]);

  const toggleVisibility = (seatName: string) => {
    setSeats(seats.map(seat => 
      seat.name === seatName ? { ...seat, visible: !seat.visible } : seat
    ));
  };

  return (
    <div className="p-6 max-w-md">
      <DeviceConfigCard
        title="PC Gaming"
        description="Configure PC gaming stations"
        count={count}
        onCountChange={setCount}
        seats={seats}
        onToggleVisibility={toggleVisibility}
      />
    </div>
  );
}
