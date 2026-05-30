"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  disconnectSocket,
  getSocketClient,
  RideSocketEvent,
  RideSocketPayload,
} from "@/lib/socket-client";
import { api } from "@/lib/api";
import { X, Wifi, WifiOff } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  type: RideSocketEvent;
  rideId?: string;
}

interface SocketContextValue {
  connected: boolean;
  joinRide: (rideId: string) => void;
  leaveRide: (rideId: string) => void;
  subscribe: (
    event: RideSocketEvent,
    handler: (payload: RideSocketPayload) => void
  ) => () => void;
  notifications: Notification[];
  dismissNotification: (id: string) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [session, setSession] = useState<{
    userId: string;
    role: string;
  } | null>(null);

  const addNotification = useCallback(
    (type: RideSocketEvent, payload: RideSocketPayload) => {
      if (!payload.message) return;
      const id = `${type}-${payload.rideId}-${Date.now()}`;
      setNotifications((prev) => [
        { id, message: payload.message!, type, rideId: payload.rideId },
        ...prev.slice(0, 4),
      ]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    },
    []
  );

  useEffect(() => {
    api<{ user: { id: string; role: string } | null }>("/api/auth/me").then(
      ({ data }) => {
        if (data?.user) {
          setSession({ userId: data.user.id, role: data.user.role });
        }
      }
    );
  }, []);

  useEffect(() => {
    if (!session) return;

    const socket = getSocketClient();
    socket.connect();
    socket.emit("join", {
      userId: session.userId,
      role: session.role,
    });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const events: RideSocketEvent[] = [
      "ride:requested",
      "ride:accepted",
      "ride:location",
      "ride:status",
      "ride:completed",
      "ride:taken",
    ];

    const handlers = events.map((event) => {
      const handler = (payload: RideSocketPayload) => addNotification(event, payload);
      socket.on(event, handler);
      return { event, handler };
    });

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      handlers.forEach(({ event, handler }) => socket.off(event, handler));
      disconnectSocket();
    };
  }, [session, addNotification]);

  const joinRide = useCallback((rideId: string) => {
    getSocketClient().emit("join_ride", rideId);
  }, []);

  const leaveRide = useCallback((rideId: string) => {
    getSocketClient().emit("leave_ride", rideId);
  }, []);

  const subscribe = useCallback(
    (event: RideSocketEvent, handler: (payload: RideSocketPayload) => void) => {
      const socket = getSocketClient();
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <SocketContext.Provider
      value={{
        connected,
        joinRide,
        leaveRide,
        subscribe,
        notifications,
        dismissNotification,
      }}
    >
      {children}
      {session && (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              connected
                ? "bg-green-500/20 text-green-400"
                : "bg-slate-700/80 text-slate-400"
            }`}
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? "Live" : "Connecting..."}
          </div>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="flex max-w-xs items-start gap-2 rounded-xl border border-sky-500/30 bg-slate-900/95 px-4 py-3 text-sm shadow-xl backdrop-blur"
            >
              <span className="flex-1">{n.message}</span>
              <button
                onClick={() => dismissNotification(n.id)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return ctx;
}

/** Safe hook — returns null handlers when outside provider (e.g. public pages) */
export function useSocketOptional() {
  return useContext(SocketContext);
}
