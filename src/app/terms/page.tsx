import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for Precision Contrast accessibility color checker",
};

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card rounded-xl p-8 md:p-12">
        <h1 className="text-h1 mb-8">Terms of Service</h1>

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
            <h2 className="text-h3 text-white">Acceptance of Terms</h2>
            <p>
              By accessing and using Precision Contrast, you accept and agree to
              be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Use License</h2>
            <p>
              Precision Contrast is provided as a free tool for checking color
              contrast and accessibility compliance. You may use this tool for
              personal and commercial projects.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Disclaimer</h2>
            <p>
              The accessibility checks and suggestions provided by Precision
              Contrast are for informational purposes only. While we strive for
              accuracy, we do not guarantee that using our tool will make your
              website fully WCAG compliant.
            </p>
            <p>
              You are responsible for ensuring your website meets accessibility
              requirements. We recommend consulting with accessibility experts
              for comprehensive audits.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Limitations</h2>
            <p>
              Precision Contrast is provided &quot;as is&quot; without
              warranties of any kind. We are not liable for any damages arising
              from the use of this tool.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Website Analysis</h2>
            <p>
              When using our website analyzer feature, you confirm that you have
              authorization to analyze the provided URLs. Do not use this tool
              to analyze websites without permission.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued
              use of Precision Contrast after changes constitutes acceptance of
              the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h3 text-white">Contact</h2>
            <p>
              For questions about these terms, please open an issue on our
              GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
