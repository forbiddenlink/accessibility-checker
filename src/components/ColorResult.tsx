interface ColorResultProps {
  mode: 'WCAG' | 'APCA';
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
    <div className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-white/50">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${passed
            ? "bg-gradient-to-br from-green-100 to-green-50 text-green-600"
            : "bg-gradient-to-br from-red-100 to-red-50 text-red-600"
          }`}
      >
        {passed ? "✓" : "✗"}
      </div>
      <span className="text-slate-700 font-medium">{label}</span>
    </div>
  );
}

export default function ColorResult({ results, mode }: ColorResultProps) {
  if (mode === 'APCA' && results.apca !== null) {
    const lc = Math.round(results.apca);
    const absLc = Math.abs(lc);

    // APCA Scoring (Rough Approximation for UI)
    // 90+ Excellent for body text
    // 75+ Good for body text
    // 60+ Good for large text
    // 45+ Good for large UI components
    const getApcaColor = (score: number) => {
      if (score >= 90) return "text-green-600";
      if (score >= 75) return "text-blue-600";
      if (score >= 60) return "text-yellow-600";
      return "text-red-600";
    };

    return (
      <div className="glass-morphism p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          APCA Results
        </h2>

        <div className="mb-8 text-center p-6 bg-white/40 rounded-lg">
          <p className="text-slate-600 mb-2">Lightness Contrast (Lc)</p>
          <p className={`text-5xl font-bold ${getApcaColor(absLc)}`}>
            Lc {absLc}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {lc < 0 ? "(Light text on dark background)" : "(Dark text on light background)"}
          </p>
        </div>

        <div className="space-y-4">
          <ResultItem label="Body Text (Preferred Lc 90+)" passed={absLc >= 90} />
          <ResultItem label="Body Text (Minimum Lc 75+)" passed={absLc >= 75} />
          <ResultItem label="Large Text (Minimum Lc 60+)" passed={absLc >= 60} />
          <ResultItem label="UI Components (Minimum Lc 45+)" passed={absLc >= 45} />
        </div>
      </div>
    );
  }

  // WCAG Mode
  const contrastScore = results.contrast.toFixed(2);
  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-600";
    if (score >= 4.5) return "text-blue-600";
    return "text-red-600";
  };

  return (
    <div className="glass-morphism p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        WCAG 2.1 Results
      </h2>

      <div className="mb-8 text-center p-6 bg-white/40 rounded-lg">
        <p className="text-slate-600 mb-2">Contrast Ratio</p>
        <p className={`text-4xl font-bold ${getScoreColor(results.contrast)}`}>
          {contrastScore}:1
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-3">AA</span>
            WCAG 2.1 Level AA
          </h3>
          <div className="space-y-2">
            <ResultItem
              label="Normal text (minimum 4.5:1)"
              passed={results.AA.normal}
            />
            <ResultItem
              label="Large text (minimum 3:1)"
              passed={results.AA.large}
            />
          </div>
        </div>

        <div className="bg-white/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-3">AAA</span>
            WCAG 2.1 Level AAA
          </h3>
          <div className="space-y-2">
            <ResultItem
              label="Normal text (minimum 7:1)"
              passed={results.AAA.normal}
            />
            <ResultItem
              label="Large text (minimum 4.5:1)"
              passed={results.AAA.large}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 