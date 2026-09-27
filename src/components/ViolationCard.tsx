import type { WcagCriterion } from "@/utils/wcagCriteria";

export type NormalizedSeverity =
  "critical" | "serious" | "error" | "moderate" | "warning" | "minor" | "info";

const SEVERITY_STYLE: Record<
  NormalizedSeverity,
  { label: string; className: string }
> = {
  critical: { label: "Critical", className: "badge-fail" },
  serious: { label: "Serious", className: "badge-fail" },
  error: { label: "Error", className: "badge-fail" },
  moderate: { label: "Moderate", className: "badge-warn" },
  warning: { label: "Warning", className: "badge-warn" },
  minor: { label: "Minor", className: "badge-info" },
  info: { label: "Info", className: "badge-info" },
};

export interface ViolationCardProps {
  /** Rule id or app issue code, e.g. "color-contrast" or "FIELD_NO_LABEL". */
  code: string;
  severity: NormalizedSeverity;
  /** What's wrong. */
  message: string;
  /** How to fix it - only rendered when the analyzer actually provided one. */
  fix?: string;
  /** Affected markup, shown as a code sample so it can be located by search. */
  element?: string;
  criterion: WcagCriterion | null;
}

export default function ViolationCard({
  code,
  severity,
  message,
  fix,
  element,
  criterion,
}: ViolationCardProps) {
  const style = SEVERITY_STYLE[severity];

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`${style.className} rounded-md px-2 py-0.5 text-caption font-semibold uppercase tracking-wide`}
        >
          {style.label}
        </span>
        <span className="font-mono text-caption text-muted-foreground">
          {code}
        </span>
        {criterion &&
          (criterion.num ? (
            <a
              href={criterion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded text-caption text-indigo-300 hover:text-indigo-200 underline decoration-dotted underline-offset-2"
            >
              WCAG {criterion.num} {criterion.title} ({criterion.level})
            </a>
          ) : (
            <a
              href={criterion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded text-caption text-muted-foreground hover:text-white underline decoration-dotted underline-offset-2"
            >
              {criterion.title}
            </a>
          ))}
      </div>

      <p className="text-body-sm text-white">{message}</p>

      {fix && (
        <p className="text-body-sm text-muted-foreground">
          <span className="font-semibold text-success">Fix: </span>
          {fix}
        </p>
      )}

      {element && (
        <code
          className="code-block block px-3 py-2 text-xs text-muted-foreground overflow-x-auto"
          tabIndex={0}
        >
          {element}
        </code>
      )}
    </div>
  );
}
