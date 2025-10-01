import { BookingTable } from '../BookingTable';

export default function BookingTableExample() {
  const bookings = [
    {
      id: "1",
      seatName: "PC-1",
      customerName: "John Doe",
      startTime: new Date(Date.now() - 35 * 60 * 1000),
      endTime: new Date(Date.now() + 25 * 60 * 1000),
      price: 70,
      status: "running" as const,
    },
    {
      id: "2",
      seatName: "PS5-1",
      customerName: "Mike Johnson",
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      endTime: new Date(Date.now() + 90 * 60 * 1000),
      price: 130,
      status: "running" as const,
    },
  ];

  return (
    <div className="p-6">
      <BookingTable
        bookings={bookings}
        onExtend={(id) => console.log('Extend booking:', id)}
        onEnd={(id) => console.log('End booking:', id)}
      />
    </div>
  );
}
