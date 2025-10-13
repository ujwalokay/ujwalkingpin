# Timezone Conversion Fix - Analytics Charts

## Issue
The analytics charts were displaying time values in UTC (e.g., 14:00, 16:00) instead of India Standard Time (IST/Asia/Kolkata timezone).

## Solution Implemented
Updated the Analytics component (`client/src/pages/Analytics.tsx`) to automatically convert all UTC timestamps to IST before rendering in charts.

## Changes Made

### 1. Added Timezone Conversion Function
Created a `convertToIST()` function that handles two types of time formats:
- **Hour format** (e.g., "14:00"): Converts UTC hour to IST equivalent
- **Timestamp format** (e.g., "12:30:45"): Converts UTC timestamp to IST time

```typescript
const convertToIST = (utcTimeString: string, isHourFormat: boolean = false): string => {
  if (isHourFormat) {
    // Converts hour like "14:00" UTC to IST (19:30)
    const [hour] = utcTimeString.split(':').map(Number);
    const utcDate = new Date();
    utcDate.setUTCHours(hour, 0, 0, 0);
    return utcDate.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } else {
    // Converts timestamp to IST
    const now = new Date();
    const [time] = utcTimeString.split(' ');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    now.setUTCHours(hours, minutes, seconds || 0, 0);
    return now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
};
```

### 2. Data Transformation
Created a `transformedStats` object using `useMemo` that converts all time values to IST:
- `hourlyUsage[].hour`: Converted from UTC to IST
- `realtimeData[].timestamp`: Converted from UTC to IST

### 3. Updated All Charts
All Recharts components now use the transformed data with IST times:
- **Occupancy Trend** (AreaChart): Uses IST timestamps
- **Hourly Activity** (BarChart): Uses IST hour labels
- **Revenue & Bookings** (ComposedChart): Uses IST hour labels
- **Peak Hours** insights: Display IST times

## Time Offset
India Standard Time (IST) is UTC+5:30, so:
- 14:00 UTC → 19:30 IST
- 16:00 UTC → 21:30 IST

## Affected Charts
1. **Overview Tab**
   - Occupancy Trend chart
   - Hourly Activity chart

2. **Performance Tab**
   - Revenue & Bookings combined chart

3. **Insights Tab**
   - Peak Hours display

All time labels and tooltips now show the correct local time (Asia/Kolkata timezone).
