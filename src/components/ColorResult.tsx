interface ColorResultProps {
  mode: "WCAG" | "APCA";
  results: {
    contrast: number;
    apca: number | null;
    AA: {
      normal: boolean;
      large: boolean;
    };
    AAA: {
      normal: boolean;
      large: boolean;
    };
  };
}

function ResultItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/8">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          passed
            ? "bg-success/20 text-success ring-1 ring-success/50"
            : "bg-destructive/20 text-destructive ring-1 ring-destructive/50"
        }`}
      >
        {passed ? "✓" : "✗"}
      </div>
      <span className="text-foreground/80 text-body-sm font-medium">
        {label}
      </span>
    </div>
  );
}

export default function ColorResult({ results, mode }: ColorResultProps) {
  // Common result box styles
  const resultBoxClass =
    "rounded-lg p-6 border border-white/8 bg-white/5 backdrop-blur-md";

  if (mode === "APCA" && results.apca !== null) {
    const lc = Math.round(results.apca);
    const absLc = Math.abs(lc);

    const getApcaColor = (score: number) => {
      if (score >= 90) return "text-green-400";
      if (score >= 75) return "text-blue-400";
      if (score >= 60) return "text-yellow-400";
      return "text-red-400";
    };

    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-caption text-muted-foreground uppercase tracking-widest">
            APCA Score
          </h2>
          <div
            className={`text-6xl font-black tracking-tighter ${getApcaColor(absLc)}`}
          >
            Lc {absLc}
          </div>
          <p className="text-caption text-muted-foreground">
            {lc < 0 ? "(Light on Dark)" : "(Dark on Light)"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultItem label="Body Text (Lc 90+)" passed={absLc >= 90} />
          <ResultItem label="Body Text (Lc 75+)" passed={absLc >= 75} />
          <ResultItem label="Large Text (Lc 60+)" passed={absLc >= 60} />
          <ResultItem label="Components (Lc 45+)" passed={absLc >= 45} />
        </div>

        {/* These read like the WCAG AA/AAA badges next to them, so say plainly
            that passing here is not conformance with anything yet. */}
        <p className="text-caption text-muted-foreground border-t border-white/5 pt-4">
          APCA is a draft candidate method for WCAG 3, which is not yet a
          published standard. These thresholds are guidance for perceptual
          legibility, not a conformance result. For a compliance claim, use the
          WCAG 2.1 tab.
        </p>
      </div>
    );
  }

  // WCAG Mode
  const contrastScore = results.contrast.toFixed(2);
  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-400";
    if (score >= 4.5) return "text-blue-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-caption text-muted-foreground uppercase tracking-widest">
          Contrast Ratio
        </h2>
        <div
          className={`text-7xl font-black tracking-tighter ${getScoreColor(results.contrast)}`}
        >
          {contrastScore}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={resultBoxClass}>
          <h3 className="text-h3 text-white mb-6 flex items-center">
            <span className="badge-info px-3 py-1 rounded-md text-caption mr-3">
              AA
            </span>
            Level AA
          </h3>
          <div className="space-y-2">
            <ResultItem
              label="Normal Text (4.5:1)"
              passed={results.AA.normal}
            />
            <ResultItem label="Large Text (3:1)" passed={results.AA.large} />
          </div>
        </div>

        <div className={resultBoxClass}>
          <h3 className="text-h3 text-white mb-6 flex items-center">
            <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-md text-caption mr-3">
              AAA
            </span>
            Level AAA
          </h3>
          <div className="space-y-2">
            <ResultItem label="Normal Text (7:1)" passed={results.AAA.normal} />
            <ResultItem label="Large Text (4.5:1)" passed={results.AAA.large} />
          </div>
        </div>
      </div>
    </div>
  );
}
