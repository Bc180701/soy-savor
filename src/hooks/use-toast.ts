
import { useState, useEffect, useCallback } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive" | "success";
  action?: React.ReactNode;
  openChange?: (open: boolean) => void;
}

export type ToasterToast = Toast & {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterActionType =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string };

let count = 0;

function generateId() {
  return `toast-${count++}`;
}

export const reducer = (state: ToasterToast[], action: ToasterActionType): ToasterToast[] => {
  switch (action.type) {
    case "ADD_TOAST":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);

    case "UPDATE_TOAST":
      return state.map((t) =>
        t.id === action.toast.id ? { ...t, ...action.toast } : t
      );

    case "DISMISS_TOAST": {
      const toast = state.find((t) => t.id === action.toastId);

      if (!toast) return state;

      return state.map((t) =>
        t.id === action.toastId ? { ...t } : t
      );
    }

    case "REMOVE_TOAST":
      return state.filter((t) => t.id !== action.toastId);

    default:
      return state;
  }
};

export function useToast() {
  const [state, setState] = useState<ToasterToast[]>([]);

  const toast = useCallback(
    (props: Omit<ToasterToast, "id"> & { id?: string }) => {
      const id = props.id || generateId();
      const newToast = { ...props, id } as ToasterToast;

      setState((state) => [...state, newToast].slice(0, TOAST_LIMIT));

      return {
        id,
        dismiss: () => setState((state) => state.filter((t) => t.id !== id)),
        update: (props: ToasterToast) => setState((state) =>
          state.map((t) => (t.id === id ? { ...t, ...props } : t))
        ),
      };
    },
    []
  );

  const dismiss = useCallback((toastId: string) => {
    setState((state) => state.filter((t) => t.id !== toastId));
  }, []);

  const update = useCallback((toastId: string, toast: Partial<ToasterToast>) => {
    setState((state) =>
      state.map((t) => (t.id === toastId ? { ...t, ...toast } : t))
    );
  }, []);

  return {
    toast,
    dismiss,
    update,
    toasts: state,
  };
}

// Création d'une fonction toast globale pour une utilisation sans hook
let toasts: ToasterToast[] = [];
const listeners: Set<(toasts: ToasterToast[]) => void> = new Set();

// Define the notify function
const notify = (props: Omit<ToasterToast, "id"> & { id?: string }) => {
  const id = props.id || generateId();
  const newToast = { ...props, id } as ToasterToast;
  
  toasts = [...toasts, newToast].slice(0, TOAST_LIMIT);
  listeners.forEach(listener => listener(toasts));
  
  return {
    id,
    dismiss: () => {
      toasts = toasts.filter(t => t.id !== id);
      listeners.forEach(listener => listener(toasts));
    },
    update: (props: Partial<ToasterToast>) => {
      toasts = toasts.map(t => t.id === id ? { ...t, ...props } : t);
      listeners.forEach(listener => listener(toasts));
    }
  };
};

// Make toast a function that can be called directly
// and also has properties from the notify function
interface ToastFunction {
  (props: Omit<ToasterToast, "id"> & { id?: string }): ReturnType<typeof notify>;
  dismiss: (toastId: string) => void;
  update: (toastId: string, props: Partial<ToasterToast>) => void;
  subscribe: (callback: (toasts: ToasterToast[]) => void) => () => boolean;
  getToasts: () => ToasterToast[];
}

export const toast = (((props: Omit<ToasterToast, "id"> & { id?: string }) => {
  return notify(props);
}) as ToastFunction);

// Add the additional methods to the toast function
toast.dismiss = (toastId: string) => {
  toasts = toasts.filter(t => t.id !== toastId);
  listeners.forEach(listener => listener(toasts));
};

toast.update = (toastId: string, props: Partial<ToasterToast>) => {
  toasts = toasts.map(t => t.id === toastId ? { ...t, ...props } : t);
  listeners.forEach(listener => listener(toasts));
};

toast.subscribe = (callback: (toasts: ToasterToast[]) => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

toast.getToasts = () => toasts;
