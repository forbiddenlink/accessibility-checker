import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy policy for Precision Contrast accessibility color checker",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card rounded-xl p-8 md:p-12">
        <h1 className="text-h1 mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Overview</h2>
            <p>
              Precision Contrast is committed to protecting your privacy. This
              policy explains what data we collect and how we use it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Data We Collect</h2>
            <p>
              <strong className="text-white">Local Storage:</strong> We store
              your saved color palettes in your browser&apos;s localStorage.
              This data never leaves your device.
            </p>
            <p>
              <strong className="text-white">URLs You Analyze:</strong> When you
              use our website analyzer, the URLs are processed server-side but
              are not stored or logged.
            </p>
            <p>
              <strong className="text-white">No Personal Information:</strong>{" "}
              We do not collect names, email addresses, or any personally
              identifiable information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Cookies</h2>
            <p>
              We only use essential cookies to remember your cookie consent
              preference. No tracking or analytics cookies are used.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Third-Party Services</h2>
            <p>
              This application does not integrate with third-party analytics,
              advertising, or tracking services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Data Deletion</h2>
            <p>
              You can delete your saved color palettes at any time by clearing
              your browser&apos;s localStorage for this site. Go to your
              browser&apos;s developer tools, navigate to Application &gt; Local
              Storage, and clear the data for this domain.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Contact</h2>
            <p>
              If you have questions about this privacy policy, please open an
              issue on our GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
