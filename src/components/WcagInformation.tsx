export default function WcagInformation() {
  const rows = [
    { level: "AA", text: "Normal text", ratio: "4.5:1" },
    { level: "AA", text: "Large text (18pt, or 14pt bold, and up)", ratio: "3:1" },
    { level: "AAA", text: "Normal text", ratio: "7:1" },
    { level: "AAA", text: "Large text (18pt, or 14pt bold, and up)", ratio: "4.5:1" },
  ];
  return (
    <div className="glass-morphism p-6 md:p-8 rounded-xl">
      <h2 className="font-display text-3xl sm:text-4xl mb-6">
        Understanding WCAG Contrast Requirements
      </h2>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_1fr]">
        <table className="w-full border-collapse text-left">
          <caption className="eyebrow pb-3 text-left">
            WCAG 2.2 minimum contrast ratio by level
          </caption>
          <thead>
            <tr className="border-y border-[rgb(var(--rule))] eyebrow">
              <th scope="col" className="py-2 pr-4 font-normal">
                Level
              </th>
              <th scope="col" className="py-2 pr-4 font-normal">
                Text
              </th>
              <th scope="col" className="py-2 text-right font-normal">
                Minimum
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.level + r.text}
                className="border-b border-[rgb(var(--rule)/0.28)]"
              >
                <th scope="row" className="py-3 pr-4 font-mono font-medium">
                  {r.level}
                </th>
                <td className="py-3 pr-4">{r.text}</td>
                <td className="py-3 text-right font-mono text-lg font-medium">
                  {r.ratio}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Why Contrast Matters</h3>
          <p className="text-muted-foreground">
            Sufficient contrast between text and its background is essential for
            people with low vision, color blindness, or who are viewing screens
            in bright environments. Good contrast benefits all users by making
            content more readable and reducing eye strain.
          </p>
          <p className="text-muted-foreground">
            Level AA is the standard level of compliance most websites should
            aim for. Level AAA is the highest level.
          </p>
          <ul className="space-y-2 pt-2">
            <li>
              <a
                href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Understanding Contrast (Minimum) &ndash; AA
              </a>
            </li>
            <li>
              <a
                href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Understanding Contrast (Enhanced) &ndash; AAA
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
