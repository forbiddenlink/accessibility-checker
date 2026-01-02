interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  const inputId = label.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-3">
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-20 rounded-lg cursor-pointer border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            aria-label={`${label} Picker`}
          />
        </div>
        <input
          id={inputId}
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border-2 border-slate-200 px-4 py-2 text-slate-900 placeholder-slate-400
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );
} 