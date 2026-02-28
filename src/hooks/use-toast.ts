import { useState, useEffect } from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let listeners: ((toast: ToastProps) => void)[] = []

function dispatch(toast: ToastProps) {
  listeners.forEach((listener) => listener(toast))
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    const listener = (toast: ToastProps) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.slice(1))
      }, 3000)
    }
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  return {
    toast: dispatch,
    toasts,
  }
}
