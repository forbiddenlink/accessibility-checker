interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  const inputId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="relative h-12 w-24 rounded-lg cursor-pointer border-0 p-0 overflow-hidden ring-1 ring-white/10"
            aria-label={`${label} Picker`}
          />
        </div>
        <div className="relative flex-1 group">
           <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition duration-500 blur"></div>
           <input
            id={inputId}
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="relative w-full h-12 rounded-lg bg-black/50 border border-white/10 px-4 text-white placeholder-white/20
                     focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase font-mono tracking-wider backdrop-blur-xl"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
} 