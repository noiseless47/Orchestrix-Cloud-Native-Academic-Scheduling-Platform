"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastItem = { id: number; message: string; kind: "success" | "error" };
type ToastContextValue = { toast: (message: string, kind?: ToastItem["kind"]) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((message: string, kind: ToastItem["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 5000);
  }, []);
  const dismiss = (id: number) => setItems((current) => current.filter((item) => item.id !== id));
  return <ToastContext.Provider value={{ toast }}>{children}<div className="toast-region" aria-label="Notifications" aria-live="polite" aria-relevant="additions">
    {items.map((item) => <div key={item.id} className={`toast-item toast-${item.kind}`} role={item.kind === "error" ? "alert" : "status"}>{item.kind === "success" ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}<span>{item.message}</span><button aria-label="Dismiss notification" onClick={() => dismiss(item.id)}><X size={16}/></button></div>)}
  </div></ToastContext.Provider>;
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToastContext must be used within ToastProvider");
  return context;
}
