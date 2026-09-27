export default function FontSizeAccessibility() {
  return (
    <div className="glass-morphism p-6 rounded-xl mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-white">
        Text Size &amp; Accessibility
      </h2>

      <div className="space-y-6">
        <p className="text-muted-foreground">
          WCAG guidelines have different contrast requirements based on text
          size. Here&apos;s how text size relates to contrast requirements:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-5 rounded-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-3 text-white">
              Normal Text
            </h3>
            <div className="flex mb-4">
              <div className="w-16 h-16 flex items-center justify-center bg-accent/20 text-indigo-300 rounded-lg mr-4 border border-accent/20">
                <span className="text-lg font-bold">Aa</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  Less than 18pt (24px) or
                </p>
                <p className="text-muted-foreground mb-1">
                  Less than 14pt (18.6px) if bold
                </p>
                <div className="mt-2 text-xs font-medium space-x-2">
                  <span className="badge-info px-2 py-1 rounded">
                    4.5:1 for AA
                  </span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                    7:1 for AAA
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-black/20 p-3 rounded border border-white/5">
              Most body text on websites falls into this category, including
              paragraphs, lists, table content, and navigation links.
            </div>
          </div>

          <div className="bg-white/5 p-5 rounded-lg border border-white/5">
            <h3 className="text-lg font-semibold mb-3 text-white">
              Large Text
            </h3>
            <div className="flex mb-4">
              <div className="w-16 h-16 flex items-center justify-center bg-success/20 text-success rounded-lg mr-4 border border-success/20">
                <span className="text-2xl font-bold">Aa</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">
                  At least 18pt (24px) or
                </p>
                <p className="text-muted-foreground mb-1">
                  At least 14pt (18.6px) if bold
                </p>
                <div className="mt-2 text-xs font-medium space-x-2">
                  <span className="badge-info px-2 py-1 rounded">
                    3:1 for AA
                  </span>
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                    4.5:1 for AAA
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-black/20 p-3 rounded border border-white/5">
              Larger text is generally used for headings, titles, and emphasized
              content that needs to stand out on the page.
            </div>
          </div>
        </div>

        <div className="mt-6 bg-warning/10 border-l-4 border-warning/50 p-4 rounded-r-lg">
          <h3 className="text-lg font-medium text-warning mb-2">
            Font Size Tip
          </h3>
          <p className="text-warning">
            When designing, remember that the actual perceived size of text
            depends on the specific font family used. Some fonts appear smaller
            at the same pixel size compared to others.
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <a
            href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center font-medium focus-ring rounded"
          >
            WCAG 2.2 Contrast Guidelines
            <svg
              className="ml-1 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
