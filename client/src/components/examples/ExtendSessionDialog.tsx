import { useState } from 'react';
import { ExtendSessionDialog } from '../ExtendSessionDialog';
import { Button } from '@/components/ui/button';

export default function ExtendSessionDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Extend Dialog</Button>
      <ExtendSessionDialog
        open={open}
        onOpenChange={setOpen}
        seatName="PC-1"
        onConfirm={(duration, price) => console.log(`Extended by ${duration} for ₹${price}`)}
      />
    </div>
  );
}
