export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateString(baseDateStr: string, offsetDays: number): string {
  // Parsing as T00:00:00 ensures it is treated as a local time date representation
  const date = new Date(baseDateStr + 'T00:00:00');
  date.setDate(date.getDate() + offsetDays);
  return getLocalDateString(date);
}

export function calculateStreak(history: string[], todayStr: string): number {
  const completed = new Set(history);
  
  let streak = 0;
  let currentStr = todayStr;
  
  // If today is completed, we count starting today and go backward
  if (completed.has(todayStr)) {
    while (completed.has(currentStr)) {
      streak++;
      currentStr = getOffsetDateString(currentStr, -1);
    }
  } else {
    // If today is not completed, check if yesterday was completed to keep streak alive
    const yesterdayStr = getOffsetDateString(todayStr, -1);
    currentStr = yesterdayStr;
    if (completed.has(yesterdayStr)) {
      while (completed.has(currentStr)) {
        streak++;
        currentStr = getOffsetDateString(currentStr, -1);
      }
    }
  }
  
  return streak;
}

export function calculateMaxStreak(history: string[]): number {
  if (history.length === 0) return 0;
  
  // Sort dates in ascending order
  const sortedDates = [...history].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDateStr: string | null = null;
  
  for (const dateStr of sortedDates) {
    if (prevDateStr === null) {
      currentStreak = 1;
    } else {
      const diffTime = new Date(dateStr + 'T00:00:00').getTime() - new Date(prevDateStr + 'T00:00:00').getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    prevDateStr = dateStr;
  }
  
  maxStreak = Math.max(maxStreak, currentStreak);
  return maxStreak;
}

export interface DayInfo {
  dateStr: string;
  label: string; // e.g. "29"
  dayName: string; // e.g. "Fri"
}


export function getRecent7Days(todayStr: string): DayInfo[] {
  const days: DayInfo[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const dateStr = getOffsetDateString(todayStr, -i);
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = dayNames[date.getDay()];
    const label = String(date.getDate());
    days.push({ dateStr, label, dayName });
  }
  
  return days;
}
