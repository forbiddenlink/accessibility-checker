import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card rounded-xl p-12 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-muted-foreground">404</span>
        </div>
        <h1 className="text-h2 mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
