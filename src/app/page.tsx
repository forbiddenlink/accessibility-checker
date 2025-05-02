"use client";

import { useState } from "react";
import ColorResult from "@/components/ColorResult";
import ColorPicker from "@/components/ColorPicker";

export default function Home() {
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkColors = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/check-contrast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foreground: foregroundColor,
          background: backgroundColor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check colors");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError("Failed to check colors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Check Color Contrast</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker
            label="Text Color"
            color={foregroundColor}
            onChange={setForegroundColor}
          />
          <ColorPicker
            label="Background Color"
            color={backgroundColor}
            onChange={setBackgroundColor}
          />
        </div>
        <div className="mt-6">
          <button
            onClick={checkColors}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking..." : "Check Contrast"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      )}

      {results && <ColorResult results={results} />}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <div
          className="p-4 rounded-md border"
          style={{
            backgroundColor: backgroundColor,
            color: foregroundColor,
          }}
        >
          <p className="text-2xl font-bold">Sample Text</p>
          <p>This is how your text will look with the selected colors.</p>
        </div>
      </div>
    </div>
  );
}
