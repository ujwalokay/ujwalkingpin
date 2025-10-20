import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  "data-testid"?: string
}

export function DateTimePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  "data-testid": testId
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [selectedHour, setSelectedHour] = React.useState<string>(
    value ? format(value, "HH") : "12"
  )
  const [selectedMinute, setSelectedMinute] = React.useState<string>(
    value ? format(value, "mm") : "00"
  )

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setSelectedHour(format(value, "HH"))
      setSelectedMinute(format(value, "mm"))
    }
  }, [value])

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      onChange(undefined)
      return
    }
    
    const newDate = new Date(date)
    newDate.setHours(parseInt(selectedHour))
    newDate.setMinutes(parseInt(selectedMinute))
    setSelectedDate(newDate)
  }

  const handleTimeChange = (hour: string, minute: string) => {
    if (!selectedDate) return
    
    const newDate = new Date(selectedDate)
    newDate.setHours(parseInt(hour))
    newDate.setMinutes(parseInt(minute))
    setSelectedDate(newDate)
    onChange(newDate)
  }

  const handleApply = () => {
    if (selectedDate) {
      const finalDate = new Date(selectedDate)
      finalDate.setHours(parseInt(selectedHour))
      finalDate.setMinutes(parseInt(selectedMinute))
      onChange(finalDate)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          data-testid={testId}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <span>{format(value, "PPP 'at' HH:mm")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedHour}
                onValueChange={(hour) => {
                  setSelectedHour(hour)
                  handleTimeChange(hour, selectedMinute)
                }}
              >
                <SelectTrigger className="w-[100px]" data-testid="select-hour">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center text-xl font-semibold">:</span>
              <Select
                value={selectedMinute}
                onValueChange={(minute) => {
                  setSelectedMinute(minute)
                  handleTimeChange(selectedHour, minute)
                }}
              >
                <SelectTrigger className="w-[100px]" data-testid="select-minute">
                  <SelectValue placeholder="Minute" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleApply} 
              className="w-full" 
              disabled={!selectedDate}
              data-testid="button-apply-datetime"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
