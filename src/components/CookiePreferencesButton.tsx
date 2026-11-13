"use client";

export default function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-cookie-preferences"))}
      className="text-left text-sm md:text-right"
    >
      Cookie preferences
    </button>
  );
}
