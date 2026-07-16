"use client";

import { useState, useEffect, useRef } from "react";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowBanner(true);
    }
  }, []);

  // The banner renders last in the DOM and is fixed over the foot of the page,
  // so without moving focus a keyboard user must tab the whole page to reach
  // it, while it covers whatever they focus down there.
  useEffect(() => {
    if (showBanner) acceptRef.current?.focus();
  }, [showBanner]);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      onKeyDown={(e) => {
        if (e.key === "Escape") declineCookies();
      }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="max-w-4xl mx-auto glass-card rounded-xl p-6 shadow-2xl shadow-black/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 id="cookie-consent-title" className="font-semibold mb-1">
              Cookie Preferences
            </h2>
            <p
              id="cookie-consent-description"
              className="text-sm text-muted-foreground"
            >
              We use cookies to store your color palettes locally. No data is
              sent to external servers.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={declineCookies}
              className="focus-ring flex-1 sm:flex-none px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
            >
              Decline
            </button>
            <button
              ref={acceptRef}
              type="button"
              onClick={acceptCookies}
              className="focus-ring flex-1 sm:flex-none px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
