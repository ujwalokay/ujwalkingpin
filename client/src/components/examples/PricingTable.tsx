import { PricingTable } from '../PricingTable';

export default function PricingTableExample() {
  const slots = [
    { duration: "30 mins", price: 40 },
    { duration: "1 hour", price: 70 },
    { duration: "2 hours", price: 130 },
  ];

  return (
    <div className="p-6 max-w-md">
      <PricingTable
        category="PC"
        slots={slots}
        onUpdateSlots={(slots) => console.log('Updated slots:', slots)}
      />
    </div>
  );
}
