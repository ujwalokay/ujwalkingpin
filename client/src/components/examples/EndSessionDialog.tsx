import { useState } from 'react';
import { EndSessionDialog } from '../EndSessionDialog';
import { Button } from '@/components/ui/button';

export default function EndSessionDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)} variant="destructive">Open End Dialog</Button>
      <EndSessionDialog
        open={open}
        onOpenChange={setOpen}
        seatName="PC-1"
        customerName="John Doe"
        onConfirm={() => console.log('Session ended')}
      />
    </div>
  );
}
