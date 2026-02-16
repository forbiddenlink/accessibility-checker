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
    <div className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/5 border border-transparent hover:border-white/10">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${passed
            ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/50"
            : "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
          }`}
      >
        {passed ? "✓" : "✗"}
      </div>
      <span className="text-white/80 font-medium">{label}</span>
    </div>
  );
}

export default function ColorResult({ results, mode }: ColorResultProps) {
  // Common result box styles
  const resultBoxClass = "rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur-md";

  if (mode === 'APCA' && results.apca !== null) {
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
           <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">APCA Score</h2>
           <div className={`text-6xl font-black tracking-tighter ${getApcaColor(absLc)}`}>
             Lc {absLc}
           </div>
           <p className="text-sm text-white/50">
             {lc < 0 ? "(Light on Dark)" : "(Dark on Light)"}
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ResultItem label="Body Text (Lc 90+)" passed={absLc >= 90} />
          <ResultItem label="Body Text (Lc 75+)" passed={absLc >= 75} />
          <ResultItem label="Large Text (Lc 60+)" passed={absLc >= 60} />
          <ResultItem label="Components (Lc 45+)" passed={absLc >= 45} />
        </div>
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
         <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Contrast Ratio</h2>
         <div className={`text-7xl font-black tracking-tighter ${getScoreColor(results.contrast)} drop-shadow-2xl`}>
           {contrastScore}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={resultBoxClass}>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs mr-3 ring-1 ring-blue-500/50">AA</span>
            Level AA
          </h3>
          <div className="space-y-2">
            <ResultItem
              label="Normal Text (4.5:1)"
              passed={results.AA.normal}
            />
            <ResultItem
              label="Large Text (3:1)"
              passed={results.AA.large}
            />
          </div>
        </div>

        <div className={resultBoxClass}>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs mr-3 ring-1 ring-purple-500/50">AAA</span>
            Level AAA
          </h3>
          <div className="space-y-2">
            <ResultItem
              label="Normal Text (7:1)"
              passed={results.AAA.normal}
            />
            <ResultItem
              label="Large Text (4.5:1)"
              passed={results.AAA.large}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 