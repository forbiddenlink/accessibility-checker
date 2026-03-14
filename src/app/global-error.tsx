"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center p-12">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Critical Error</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            A critical error occurred. Please refresh the page or try again
            later.
          </p>
          <button
            onClick={reset}
            className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-lg font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
