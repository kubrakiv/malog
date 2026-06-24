import { createContext, useContext, useEffect, useRef } from "react";

const SovtesRealtimeContext = createContext(null);

/**
 * App-level SSE connection to /api/sovtes/events/.
 * Opens once per session and survives page navigation.
 * Components subscribe/unsubscribe handlers via useSovtesEvents().
 */
export function SovtesRealtimeProvider({ children }) {
  const handlersRef = useRef(new Set());

  useEffect(() => {
    let es = null;

    const connect = () => {
      try {
        const raw = localStorage.getItem("userInfo");
        const userInfo = raw ? JSON.parse(raw) : {};
        const token = userInfo.token || userInfo.access || "";
        if (!token) return;

        es = new EventSource(`/api/sovtes/events/?token=${encodeURIComponent(token)}`);

        es.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data);
            handlersRef.current.forEach((fn) => {
              try { fn(event); } catch {}
            });
          } catch {}
        };

        es.onerror = () => {
          // EventSource auto-reconnects per spec — nothing to do
        };
      } catch {}
    };

    connect();
    return () => es?.close();
  }, []);

  const subscribe = (fn) => handlersRef.current.add(fn);
  const unsubscribe = (fn) => handlersRef.current.delete(fn);

  return (
    <SovtesRealtimeContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </SovtesRealtimeContext.Provider>
  );
}

export function useSovtesEvents(handler) {
  const ctx = useContext(SovtesRealtimeContext);

  useEffect(() => {
    if (!ctx || !handler) return;
    ctx.subscribe(handler);
    return () => ctx.unsubscribe(handler);
    // handler identity must be stable — wrap in useCallback or useRef before passing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);
}
