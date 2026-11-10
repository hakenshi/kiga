import { eachDayOfInterval, EachDayOfIntervalResult, endOfWeek, startOfWeek } from "date-fns";
import { create } from "zustand";

interface State {
  interval: EachDayOfIntervalResult<{
    start: Date,
    end: Date,
  }, undefined>
  start: Date,
  end: Date
  current: Date | null
  query: string
}

interface Actions {
  updateState: ({ end, start, interval }: State) => void
  updateInterval: (interval: State["interval"]) => void
  updateStart: (start: State["start"]) => void
  updateEnd: (end: State["end"]) => void
  updateCurrent: (current: State["current"]) => void
  updateQuery: (query: State["query"]) => void
  reset: () => void
}

export const useFeedFilterStore = create<State & Actions>()((set) => ({
  end: endOfWeek(new Date()),
  start: startOfWeek(new Date()),
  interval: eachDayOfInterval(
    {
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date()),
    }
  ),
  query: "",
  current: null,
  updateEnd: (end) => set((f) => ({ ...f, end })),
  updateInterval: (interval) => set((f) => ({ ...f, interval })),
  updateStart: (start) => set((f) => ({ ...f, start })),
  updateState: (state) => set(() => ({ ...state })),
  updateCurrent: (current) => set(f => ({ ...f, current })),
  updateQuery: (query) => set(f => ({ ...f, query })),
  reset: () => {
    set(() => ({
      current: null,
      end: endOfWeek(new Date()),
      start: startOfWeek(new Date()),
      interval: eachDayOfInterval(
        {
          start: startOfWeek(new Date()),
          end: endOfWeek(new Date()),
        }
      ),
    }))
  }
}))
