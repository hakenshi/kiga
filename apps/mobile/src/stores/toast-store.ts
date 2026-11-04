import { create } from "zustand";
import { formatAppError } from "@/lib/error-formatter";

export interface ToastItem {
  id: string;
  type: "error" | "info" | "action";
  message: string;
  technicalDetails?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

interface ToastStore {
  currentToast: ToastItem | null;
  showError: (message: string, rawError?: unknown) => void;
  showInfo: (message: string, duration?: number) => void;
  showAction: (
    message: string,
    actionLabel: string,
    onAction: () => void,
    duration?: number
  ) => void;
  dismiss: () => void;
}

let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set, get) => ({
  currentToast: null,

  showError: (fallbackMsg, rawError) => {
    if (timeoutHandle) clearTimeout(timeoutHandle);

    const { message, technicalDetails } = formatAppError(rawError, fallbackMsg);
    const duration = 5000;

    set({
      currentToast: {
        id: Math.random().toString(36).slice(2),
        type: "error",
        message,
        technicalDetails,
        duration,
      },
    });

    timeoutHandle = setTimeout(() => {
      get().dismiss();
    }, duration);
  },

  showInfo: (message, duration = 3000) => {
    if (timeoutHandle) clearTimeout(timeoutHandle);

    set({
      currentToast: {
        id: Math.random().toString(36).slice(2),
        type: "info",
        message,
        duration,
      },
    });

    timeoutHandle = setTimeout(() => {
      get().dismiss();
    }, duration);
  },

  showAction: (message, actionLabel, onAction, duration = 4500) => {
    if (timeoutHandle) clearTimeout(timeoutHandle);

    set({
      currentToast: {
        id: Math.random().toString(36).slice(2),
        type: "action",
        message,
        actionLabel,
        onAction,
        duration,
      },
    });

    timeoutHandle = setTimeout(() => {
      get().dismiss();
    }, duration);
  },

  dismiss: () => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    timeoutHandle = null;
    set({ currentToast: null });
  },
}));
