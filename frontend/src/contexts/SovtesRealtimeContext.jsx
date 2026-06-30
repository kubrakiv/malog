import Pusher from "pusher-js";
import { createContext, useContext, useEffect, useRef } from "react";

const SovtesRealtimeContext = createContext(null);

const TENDER_EVENTS = [
  "tenderCreated",
  "bid",
  "ended",
  "winnerChoosen",
  "deleted",
  "revived",
  "updated",
];

/**
 * App-level Pusher connection to the user's private Sovtes channel.
 * Opens once per session and survives page navigation.
 * Components subscribe/unsubscribe handlers via useSovtesEvents().
 */
export function SovtesRealtimeProvider({ children }) {
  const handlersRef = useRef(new Set());

  useEffect(() => {
    let pusher = null;
    let channel = null;

    const connect = async () => {
      try {
        const raw = localStorage.getItem("userInfo");
        const userInfo = raw ? JSON.parse(raw) : {};
        const token = userInfo.token || userInfo.access || "";
        if (!token) return;

        // Fetch Pusher key, cluster, and the user's private channel name from backend
        const res = await fetch("/api/sovtes/pusher-config/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const { key, cluster, channel: channelName } = await res.json();
        if (!key || !channelName) return;

        if (import.meta.env.DEV) Pusher.logToConsole = true;
        pusher = new Pusher(key, {
          cluster,
          channelAuthorization: {
            endpoint: "/api/sovtes/pusher-auth/",
            transport: "ajax",
            headers: { Authorization: `Bearer ${token}` },
          },
        });

        channel = pusher.subscribe(channelName);

        TENDER_EVENTS.forEach((eventName) => {
          channel.bind(eventName, (data) => {
            console.log(`[Sovtes] event: ${eventName}`, data);
            const event = { type: eventName, ...(data || {}) };
            handlersRef.current.forEach((fn) => {
              try { fn(event); } catch {}
            });
          });
        });

        // Catch any event Sovtes fires that isn't in TENDER_EVENTS (e.g. route confirmations)
        channel.bind_global((eventName, data) => {
          if (TENDER_EVENTS.includes(eventName) || eventName.startsWith("pusher:")) return;
          console.log(`[Sovtes] unlisted event: ${eventName}`, data);
          const event = { type: eventName, ...(data || {}) };
          handlersRef.current.forEach((fn) => {
            try { fn(event); } catch {}
          });
        });
      } catch {}
    };

    connect();

    return () => {
      channel?.unbind_all();
      pusher?.disconnect();
    };
  }, []);

  const subscribe = (fn) => handlersRef.current.add(fn);
  const unsubscribe = (fn) => handlersRef.current.delete(fn);

  return (
    <SovtesRealtimeContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </SovtesRealtimeContext.Provider>
  );
}

/**
 * Attach a stable event handler to the Sovtes real-time channel.
 * The handler receives { type, periodic, route_id, ...eventData }.
 * Must be wrapped in useCallback (or useRef) before passing — it is used as a Set key.
 */
export function useSovtesEvents(handler) {
  const ctx = useContext(SovtesRealtimeContext);

  useEffect(() => {
    if (!ctx || !handler) return;
    ctx.subscribe(handler);
    return () => ctx.unsubscribe(handler);
  }, [ctx, handler]);
}
