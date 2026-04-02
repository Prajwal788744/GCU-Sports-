import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Download, X } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * A sleek bottom banner prompting the user to install the PWA.
 * Shows only when the browser fires `beforeinstallprompt` and the user hasn't dismissed.
 * Sits above any bottom navigation for mobile-friendly positioning.
 */
export default function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  // Delay showing the prompt so it doesn't pop in immediately on load
  useEffect(() => {
    if (!canInstall) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [canInstall]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-[9998] mx-auto max-w-md transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(52, 83, 109, 0.95), rgba(26, 45, 64, 0.98))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Subtle glow */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

        <div className="relative flex items-start gap-3 p-4">
          {/* Icon */}
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Download className="h-5 w-5 text-blue-300" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Install GCU Sports</p>
            <p className="mt-0.5 text-xs text-white/60 leading-relaxed">
              Add to your home screen for a faster, app-like experience
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={promptInstall}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-gray-900 transition-all hover:bg-gray-100 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </button>
              <button
                onClick={dismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/80"
              >
                Not now
              </button>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={dismiss}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
