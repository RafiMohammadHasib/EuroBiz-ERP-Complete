
"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "./separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

type DateRangePickerProps = React.HTMLAttributes<HTMLDivElement> & {
    onUpdate: (values: { range?: DateRange }) => void,
    initialDateFrom?: Date | string,
    initialDateTo?: Date | string,
    align?: "start" | "center" | "end",
    locale?: string
}

export function DateRangePicker({
    className,
    onUpdate,
    initialDateFrom,
    initialDateTo,
    align = "end",
}: DateRangePickerProps) {

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: initialDateFrom ? new Date(initialDateFrom) : subDays(new Date(), 29),
        to: initialDateTo ? new Date(initialDateTo) : new Date(),
    })
    
    const [preset, setPreset] = React.useState<string>('30d')

    const handleUpdate = (range: DateRange | undefined) => {
        setDate(range);
        onUpdate({range});
    }

    const handleReset = () => {
        setPreset('30d');
        const defaultRange = {from: subDays(new Date(), 29), to: new Date()};
        setDate(defaultRange);
        onUpdate({range: defaultRange});
    }

    const handlePresetChange = (value: string) => {
        setPreset(value);
        const now = new Date();
        let fromDate;
        switch (value) {
            case '7d':
                fromDate = subDays(now, 6);
                break;
            case '30d':
                fromDate = subDays(now, 29);
                break;
            case '90d':
                fromDate = subDays(now, 89);
                break;
            default:
                fromDate = undefined;
        }
        const newRange = fromDate ? { from: fromDate, to: now } : undefined;
        setDate(newRange);
        onUpdate({range: newRange});
    }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full md:w-[260px] justify-start text-left font-normal h-9",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <div className="flex">
            <div className="p-3 border-r">
                <Select onValueChange={handlePresetChange} value={preset}>
                    <SelectTrigger className="w-[180px] focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1">
                 <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleUpdate}
                    numberOfMonths={2}
                />
            </div>
          </div>
           <Separator />
          <div className="p-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleReset}><X className="mr-2 h-4 w-4" /> Reset</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
