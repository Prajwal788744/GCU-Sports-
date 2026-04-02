import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Animated offline banner that slides down from the top when the user loses connection,
 * and slides up with a "back online" message when reconnected.
 */
export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
      setReconnected(false);
    } else if (wasOffline && isOnline) {
      // Just came back online
      setReconnected(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out ${
        showBanner ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
          reconnected
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
            : "bg-gradient-to-r from-red-600 to-red-500"
        }`}
        style={{
          paddingTop: "calc(0.625rem + env(safe-area-inset-top, 0px))",
        }}
      >
        {reconnected ? (
          <>
            <Wifi className="h-4 w-4 animate-pulse" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You are offline — viewing cached content</span>
          </>
        )}
      </div>
    </div>
  );
}
