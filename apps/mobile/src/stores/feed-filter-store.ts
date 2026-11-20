import { NoteRepository, type NoteDateRange } from "@/repositories/note-repository";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDate,
  getYear,
  isSameDay,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isThisWeek,
  setYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { create } from "zustand";

export interface YearOption {
  value: string;
  date: Date;
  label: string;
  subtitle: string;
  isSelected: boolean;
  disabled: boolean;
}

export interface MonthOption {
  value: string;
  date: Date;
  label: string;
  subtitle: string;
  isSelected: boolean;
  disabled: boolean;
}

export interface WeekOption {
  value: string;
  indexLabel: string;
  title: string;
  subtitle: string;
  start: Date;
  end: Date;
  isCurrentWeek: boolean;
  isSelected: boolean;
  disabled: boolean;
}

export interface DayOption {
  value: string;
  date: Date;
  dayName: string;
  dayNumber: number;
  isSelected: boolean;
  disabled: boolean;
  hasNotes: boolean;
}

interface State {
  userId?: number;
  accountCreatedAt: Date;
  noteDates: Date[];
  month: Date;
  start: Date;
  end: Date;
  current: Date | null;
  isWeekFiltered: boolean;
  dateRange?: NoteDateRange;
  query: string;
  yearLabel: string;
  monthLabel: string;
  weekLabel: string;
  activeFilterLabel?: string;
  years: YearOption[];
  months: MonthOption[];
  weeks: WeekOption[];
  days: DayOption[];
}

interface Actions {
  sync: (userId?: number, accountCreatedAt?: Date | string | number) => void;
  selectYear: (year: Date) => void;
  selectMonth: (month: Date) => void;
  selectWeek: (start: Date, end: Date) => void;
  updateCurrent: (current: Date | null) => void;
  updateQuery: (query: string) => void;
  reset: () => void;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatCount(count: number) {
  return `${count} ${count === 1 ? "nota" : "notas"}`;
}

function countInRange(dates: Date[], start: Date, end: Date) {
  const min = start.getTime();
  const max = end.getTime();
  let count = 0;
  for (const d of dates) {
    const t = d.getTime();
    if (t >= min && t <= max) count++;
  }
  return count;
}

function resolveMinDate(accountCreatedAt: Date, noteDates: Date[], today: Date) {
  let minTime = Math.min(accountCreatedAt.getTime(), today.getTime());
  for (const d of noteDates) {
    const t = d.getTime();
    if (t < minTime) minTime = t;
  }
  return startOfDay(new Date(minTime));
}

function buildDerivedView(params: {
  month: Date;
  start: Date;
  end: Date;
  current: Date | null;
  isWeekFiltered: boolean;
  accountCreatedAt: Date;
  noteDates: Date[];
}) {
  const today = new Date();
  const { month, start, end, current, isWeekFiltered, accountCreatedAt, noteDates } = params;
  const minDate = resolveMinDate(accountCreatedAt, noteDates, today);

  const yearDates = eachYearOfInterval({
    start: startOfYear(minDate),
    end: startOfYear(today),
  }).reverse();

  const years: YearOption[] = yearDates.map((y) => {
    const count = countInRange(noteDates, startOfYear(y), endOfYear(y));
    const currentYear = isSameYear(y, today);
    const isSelected = isSameYear(y, month);
    const subtitle = currentYear
      ? count > 0
        ? `Ano atual • ${formatCount(count)}`
        : "Ano atual"
      : count > 0
        ? formatCount(count)
        : "Sem notas";

    return {
      value: y.toISOString(),
      date: y,
      label: format(y, "yyyy", { locale: ptBR }),
      subtitle,
      isSelected,
      disabled: !currentYear && count === 0,
    };
  });

  const months: MonthOption[] = eachMonthOfInterval({
    start: startOfYear(month),
    end: endOfYear(month),
  }).map((m) => {
    const mStart = startOfMonth(m);
    const mEnd = endOfMonth(m);
    const isFuture = mStart.getTime() > endOfMonth(today).getTime();
    const isBeforeMin = mEnd.getTime() < startOfMonth(minDate).getTime();
    const isCurrentMonth = isSameMonth(m, today);
    const count = countInRange(noteDates, mStart, mEnd);
    const disabled = isFuture || isBeforeMin || (!isCurrentMonth && count === 0);

    let subtitle = formatCount(count);
    if (isFuture) {
      subtitle = "Futuro";
    } else if (isBeforeMin || count === 0) {
      subtitle = isCurrentMonth ? "Mês atual" : "Sem notas";
    } else if (isCurrentMonth) {
      subtitle = `Mês atual • ${formatCount(count)}`;
    }

    return {
      value: mStart.toISOString(),
      date: mStart,
      label: capitalize(format(mStart, "MMMM", { locale: ptBR })),
      subtitle,
      isSelected: isSameMonth(mStart, month),
      disabled,
    };
  });

  const rawWeeks = eachWeekOfInterval(
    { start: startOfMonth(month), end: endOfMonth(month) },
    { weekStartsOn: 0 }
  );

  const weeks: WeekOption[] = [];
  for (const w of rawWeeks) {
    const wStart = startOfWeek(w, { weekStartsOn: 0, locale: ptBR });
    const wEnd = endOfWeek(w, { weekStartsOn: 0, locale: ptBR });

    if (wStart.getTime() > endOfDay(today).getTime()) continue;
    if (wEnd.getTime() < startOfDay(minDate).getTime()) continue;

    const count = countInRange(noteDates, startOfDay(wStart), endOfDay(wEnd));
    const isCurrentWeek = isSameWeek(today, wStart, { weekStartsOn: 0, locale: ptBR });
    const isSelected = isWeekFiltered && isSameDay(wStart, start);
    const sameMonth = isSameMonth(wStart, wEnd);

    const title = sameMonth
      ? `${format(wStart, "d")} a ${format(wEnd, "d")} de ${format(wEnd, "MMMM", { locale: ptBR })}`
      : `${format(wStart, "d 'de' MMM", { locale: ptBR })} a ${format(wEnd, "d 'de' MMM", { locale: ptBR })}`;

    const rangeSub = `${capitalize(format(wStart, "EEE", { locale: ptBR }).slice(0, 3))} (${format(wStart, "dd/MM")}) — ${capitalize(format(wEnd, "EEE", { locale: ptBR }).slice(0, 3))} (${format(wEnd, "dd/MM")})`;
    const subtitle = `${rangeSub} • ${count > 0 ? formatCount(count) : "Sem notas"}`;

    weeks.push({
      value: wStart.toISOString(),
      indexLabel: `S${weeks.length + 1}`,
      title,
      subtitle,
      start: wStart,
      end: wEnd,
      isCurrentWeek,
      isSelected,
      disabled: !isCurrentWeek && count === 0,
    });
  }

  const days: DayOption[] = eachDayOfInterval({ start, end }).map((wd) => {
    const dStart = startOfDay(wd);
    const dEnd = endOfDay(wd);
    const isFuture = dStart.getTime() > endOfDay(today).getTime();
    const isBeforeMin = dEnd.getTime() < startOfDay(minDate).getTime();
    const count = countInRange(noteDates, dStart, dEnd);
    const isToday = isSameDay(wd, today);

    return {
      value: dStart.toISOString(),
      date: wd,
      dayName: capitalize(format(wd, "EEE", { locale: ptBR }).slice(0, 3)),
      dayNumber: getDate(wd),
      isSelected: current !== null && isSameDay(wd, current),
      disabled: isFuture || isBeforeMin || (!isToday && count === 0),
      hasNotes: count > 0,
    };
  });

  const yearLabel = format(month, "yyyy", { locale: ptBR });
  const monthLabel = capitalize(format(month, "MMMM", { locale: ptBR }));
  const weekLabel = `${isThisWeek(start, { weekStartsOn: 0 }) ? "Esta semana" : "Semana"} ${getDate(start)} - ${getDate(end)}`;

  let activeFilterLabel: string | undefined;
  if (current !== null) {
    const count = countInRange(noteDates, startOfDay(current), endOfDay(current));
    activeFilterLabel = `${capitalize(format(current, "EEE, d 'de' MMM", { locale: ptBR }))} • ${formatCount(count)}`;
  } else if (isWeekFiltered) {
    const count = countInRange(noteDates, startOfDay(start), endOfDay(end));
    const rangeText = isSameMonth(start, end)
      ? `${format(start, "d")} a ${format(end, "d 'de' MMM", { locale: ptBR })}`
      : `${format(start, "d 'de' MMM", { locale: ptBR })} a ${format(end, "d 'de' MMM", { locale: ptBR })}`;
    activeFilterLabel = `${rangeText} • ${formatCount(count)}`;
  }

  return {
    yearLabel,
    monthLabel,
    weekLabel,
    activeFilterLabel,
    years,
    months,
    weeks,
    days,
  };
}

function createInitialState(baseDate = new Date(), userId?: number, accountCreatedAt = baseDate, noteDates: Date[] = []) {
  const month = startOfMonth(baseDate);
  const start = startOfWeek(baseDate, { weekStartsOn: 0 });
  const end = endOfWeek(baseDate, { weekStartsOn: 0 });
  const current = null;
  const isWeekFiltered = false;

  return {
    userId,
    accountCreatedAt,
    noteDates,
    month,
    start,
    end,
    current,
    isWeekFiltered,
    dateRange: undefined,
    ...buildDerivedView({
      month,
      start,
      end,
      current,
      isWeekFiltered,
      accountCreatedAt,
      noteDates,
    }),
  };
}

export const useFeedFilterStore = create<State & Actions>()((set) => ({
  ...createInitialState(),
  query: "",
  sync: (userId, rawCreatedAt) =>
    set((state) => {
      const targetUserId = userId ?? state.userId;
      const accountCreatedAt = rawCreatedAt ? new Date(rawCreatedAt) : state.accountCreatedAt;
      let noteDates = state.noteDates;
      if (targetUserId) {
        try {
          noteDates = NoteRepository.findNoteDates(targetUserId);
        } catch {
          noteDates = state.noteDates;
        }
      }
      return {
        userId: targetUserId,
        accountCreatedAt,
        noteDates,
        ...buildDerivedView({
          month: state.month,
          start: state.start,
          end: state.end,
          current: state.current,
          isWeekFiltered: state.isWeekFiltered,
          accountCreatedAt,
          noteDates,
        }),
      };
    }),
  selectYear: (year) =>
    set((state) => {
      const today = new Date();
      let candidateMonth = startOfMonth(setYear(state.month, getYear(year)));
      if (candidateMonth.getTime() > startOfMonth(today).getTime()) {
        candidateMonth = startOfMonth(today);
      }
      const anchor = isSameMonth(candidateMonth, today) ? today : candidateMonth;
      const start = startOfWeek(anchor, { weekStartsOn: 0 });
      const end = endOfWeek(anchor, { weekStartsOn: 0 });
      const current = null;
      const isWeekFiltered = true;

      return {
        month: candidateMonth,
        start,
        end,
        current,
        isWeekFiltered,
        dateRange: { start: startOfDay(start), end: endOfDay(end) },
        ...buildDerivedView({
          month: candidateMonth,
          start,
          end,
          current,
          isWeekFiltered,
          accountCreatedAt: state.accountCreatedAt,
          noteDates: state.noteDates,
        }),
      };
    }),
  selectMonth: (month) =>
    set((state) => {
      const today = new Date();
      const normalizedMonth = startOfMonth(month);
      const anchor = isSameMonth(normalizedMonth, today) ? today : normalizedMonth;
      const start = startOfWeek(anchor, { weekStartsOn: 0 });
      const end = endOfWeek(anchor, { weekStartsOn: 0 });
      const current = null;
      const isWeekFiltered = true;

      return {
        month: normalizedMonth,
        start,
        end,
        current,
        isWeekFiltered,
        dateRange: { start: startOfDay(start), end: endOfDay(end) },
        ...buildDerivedView({
          month: normalizedMonth,
          start,
          end,
          current,
          isWeekFiltered,
          accountCreatedAt: state.accountCreatedAt,
          noteDates: state.noteDates,
        }),
      };
    }),
  selectWeek: (start, end) =>
    set((state) => {
      const current = null;
      const isWeekFiltered = true;
      return {
        start,
        end,
        current,
        isWeekFiltered,
        dateRange: { start: startOfDay(start), end: endOfDay(end) },
        ...buildDerivedView({
          month: state.month,
          start,
          end,
          current,
          isWeekFiltered,
          accountCreatedAt: state.accountCreatedAt,
          noteDates: state.noteDates,
        }),
      };
    }),
  updateCurrent: (day) =>
    set((state) => {
      const unselecting = day === null || (state.current !== null && isSameDay(state.current, day));
      const current = unselecting ? null : day;
      const dateRange = current
        ? { start: startOfDay(current), end: endOfDay(current) }
        : state.isWeekFiltered
          ? { start: startOfDay(state.start), end: endOfDay(state.end) }
          : undefined;

      return {
        current,
        dateRange,
        ...buildDerivedView({
          month: state.month,
          start: state.start,
          end: state.end,
          current,
          isWeekFiltered: state.isWeekFiltered,
          accountCreatedAt: state.accountCreatedAt,
          noteDates: state.noteDates,
        }),
      };
    }),
  updateQuery: (query) => set({ query }),
  reset: () =>
    set((state) => createInitialState(new Date(), state.userId, state.accountCreatedAt, state.noteDates)),
}));
