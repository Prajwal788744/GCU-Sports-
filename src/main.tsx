import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

/* ─── Service Worker Registration ─── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Handle updates — when a new SW is waiting, reload to activate it
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content available — could prompt user to refresh
              console.log("[SW] New version available. Refresh to update.");
            }
          });
        }
      });

      console.log("[SW] Registered successfully:", registration.scope);
    } catch (error) {
      console.warn("[SW] Registration failed:", error);
    }
  });
}

/* ─── Remove splash screen after React renders ─── */
requestAnimationFrame(() => {
  const splash = document.getElementById("pwa-splash");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => splash.remove(), 400);
  }
});
