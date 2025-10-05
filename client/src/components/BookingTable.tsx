import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { SessionTimer } from "./SessionTimer";
import { Clock, X, Check } from "lucide-react";

type BookingStatus = "available" | "running" | "expired" | "upcoming" | "completed";

interface Booking {
  id: string;
  seatName: string;
  customerName: string;
  whatsappNumber?: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: BookingStatus;
}

interface BookingTableProps {
  bookings: Booking[];
  onExtend?: (id: string) => void;
  onEnd?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function BookingTable({ bookings, onExtend, onEnd, onComplete }: BookingTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seat</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Time Left</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No bookings found
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                <TableCell className="font-medium" data-testid={`text-seat-${booking.id}`}>
                  {booking.seatName}
                </TableCell>
                <TableCell data-testid={`text-customer-${booking.id}`}>
                  {booking.customerName}
                </TableCell>
                <TableCell data-testid={`text-whatsapp-${booking.id}`}>
                  {booking.whatsappNumber || "-"}
                </TableCell>
                <TableCell data-testid={`text-start-${booking.id}`}>
                  {booking.startTime.toLocaleTimeString()}
                </TableCell>
                <TableCell data-testid={`text-end-${booking.id}`}>
                  {booking.endTime.toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  {booking.status === "running" && <SessionTimer endTime={booking.endTime} />}
                </TableCell>
                <TableCell className="font-bold text-primary" data-testid={`text-price-${booking.id}`}>
                  ₹{booking.price}
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {booking.status === "running" && onComplete && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onComplete(booking.id)}
                        data-testid={`button-complete-${booking.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {booking.status === "running" && onExtend && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExtend(booking.id)}
                        data-testid={`button-extend-${booking.id}`}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Extend
                      </Button>
                    )}
                    {(booking.status === "running" || booking.status === "upcoming") && onEnd && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onEnd(booking.id)}
                        data-testid={`button-end-${booking.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
