import * as React from "react"

import {
  ToastAction,
  type ToastActionElement,
  type ToastProps,
} from "../components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

// Convert API/error objects into friendly toast messages and display them
type ShowApiErrorOptions = {
  actionLabel?: string;
  action?: () => void;
  fallbackTitle?: string;
};

// Convert API/error objects into friendly toast messages and display them
function createToastAction(label: string, handler: () => void): ToastActionElement {
  return React.createElement(
    ToastAction,
    {
      altText: label,
      onClick: (event) => {
        try {
          event?.preventDefault?.();
        } catch (_) {}
        try {
          handler();
        } catch (_) {}
      }
    },
    label
  ) as unknown as ToastActionElement;
}

function showApiError(err: any, opts?: ShowApiErrorOptions) {
  // Normalize a wide range of error shapes
  const status = err?.status ?? err?.response?.status ?? err?.statusCode ?? 0;
  const server = err?.server ?? err?.response?.data ?? err?.response?.data?.detail ?? null;

  // Prefer explicit message fields, then server messages, then fallback to err.message
  const rawMessage = err?.message || server?.detail || server?.message || server || (typeof server === 'string' ? server : undefined);
  let title = opts?.fallbackTitle ?? (err?.title || server?.title || 'Error');
  let description = rawMessage || 'An unexpected error occurred.';
  let variant: any = 'destructive';

  // Map common status codes to clearer titles/descriptions
  if (status === 401) {
    title = 'Authentication Required';
    description = rawMessage || 'Please sign in to continue.';
  } else if (status === 403) {
    title = 'Permission Denied';
    description = rawMessage || 'You do not have permission to perform this action.';
  } else if (status === 404) {
    title = 'Not Found';
    description = rawMessage || 'Requested resource not found.';
  } else if (status === 0) {
    title = 'Network Error';
    description = rawMessage || 'Unable to reach the server. Please check your connection.';
  } else if (status >= 400 && status < 500) {
    // Client errors: prefer server message but keep title generic
    title = opts?.fallbackTitle ?? (err?.title || 'Request Error');
    description = rawMessage || description;
  } else if (status >= 500) {
    title = opts?.fallbackTitle ?? (err?.title || 'Server Error');
    description = rawMessage || 'The server encountered an error. Please try again later.';
  }

  // Build toast payload
  const toastPayload: any = { title, description, variant };

  // If caller supplied an action label and handler, attach it to the toast
  if (opts?.actionLabel && typeof opts?.action === 'function') {
    toastPayload.action = createToastAction(opts.actionLabel, opts.action);
  } else if (status === 401) {
    // Attach a default sign-in action for authentication errors when running in the browser
    if (typeof window !== 'undefined') {
      toastPayload.action = createToastAction('Sign in', () => {
        try { window.location.href = '/login'; } catch (_) {}
      });
    }
  }

  // Use the exported toast function to show message, fall back to window.toast if needed
  try {
    toast(toastPayload);
  } catch (e) {
    if (typeof window !== 'undefined' && (window as any).toast) {
      (window as any).toast(toastPayload);
    }
  }
}

export { useToast, toast, showApiError }
