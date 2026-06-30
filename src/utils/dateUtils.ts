import { EventItem, Prefecture, Category } from '../types';

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateJP(date: Date, includeYear = false): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = days[date.getDay()];
  if (includeYear) {
    return `${date.getFullYear()}年${m}月${d}日(${dayName})`;
  }
  return `${m}月${d}日(${dayName})`;
}

export interface WeekendRange {
  start: Date;
  end: Date;
  label: string;
}

export function getWeekendRanges(baseDate: Date = new Date()): {
  thisWeekend: WeekendRange;
  nextWeekend: WeekendRange;
  afterWeekend: WeekendRange;
} {
  // Let's find the Monday of the current week
  const day = baseDate.getDay();
  // If Sunday (0), we offset by -6 to get previous Monday, else offset by (1 - day)
  const diffToMonday = baseDate.getDate() - day + (day === 0 ? -6 : 1);
  
  const monday = new Date(baseDate);
  monday.setDate(diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // This weekend (Saturday & Sunday)
  const thisSat = new Date(monday);
  thisSat.setDate(monday.getDate() + 5);
  const thisSun = new Date(monday);
  thisSun.setDate(monday.getDate() + 6);

  // Next weekend
  const nextSat = new Date(monday);
  nextSat.setDate(monday.getDate() + 12);
  const nextSun = new Date(monday);
  nextSun.setDate(monday.getDate() + 13);

  // Weekend after next
  const afterSat = new Date(monday);
  afterSat.setDate(monday.getDate() + 19);
  const afterSun = new Date(monday);
  afterSun.setDate(monday.getDate() + 20);

  return {
    thisWeekend: {
      start: thisSat,
      end: thisSun,
      label: `今週末 (${formatDateJP(thisSat)} 〜 ${formatDateJP(thisSun)})`
    },
    nextWeekend: {
      start: nextSat,
      end: nextSun,
      label: `来週末 (${formatDateJP(nextSat)} 〜 ${formatDateJP(nextSun)})`
    },
    afterWeekend: {
      start: afterSat,
      end: afterSun,
      label: `再来週末 (${formatDateJP(afterSat)} 〜 ${formatDateJP(afterSun)})`
    }
  };
}

/**
 * Resolves raw events into concrete start and end dates relative to the base date.
 */
export function resolveEventDates(rawEvents: EventItem[], baseDate: Date = new Date()): EventItem[] {
  const { thisWeekend, nextWeekend, afterWeekend } = getWeekendRanges(baseDate);

  return rawEvents.map(event => {
    let start: Date;
    let end: Date;

    switch (event.dateType) {
      case 'this_weekend':
        start = thisWeekend.start;
        end = thisWeekend.end;
        break;
      case 'next_weekend':
        start = nextWeekend.start;
        end = nextWeekend.end;
        break;
      case 'after_weekend':
        start = afterWeekend.start;
        end = afterWeekend.end;
        break;
      case 'all_season':
        // spans 5 days before this weekend through 5 days after after_weekend
        start = new Date(thisWeekend.start);
        start.setDate(start.getDate() - 5);
        end = new Date(afterWeekend.end);
        end.setDate(end.getDate() + 5);
        break;
      case 'past':
        start = new Date(thisWeekend.start);
        start.setDate(start.getDate() - 15);
        end = new Date(thisWeekend.start);
        end.setDate(end.getDate() - 13);
        break;
      case 'future':
        start = new Date(afterWeekend.end);
        start.setDate(start.getDate() + 10);
        end = new Date(afterWeekend.end);
        end.setDate(end.getDate() + 12);
        break;
      default:
        start = thisWeekend.start;
        end = thisWeekend.end;
    }

    return {
      ...event,
      resolvedStartDate: formatDate(start),
      resolvedEndDate: formatDate(end),
    };
  });
}
