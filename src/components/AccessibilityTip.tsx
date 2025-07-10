import { useState } from 'react';

interface AccessibilityTipProps {
  title: string;
  children: React.ReactNode;
}

export default function AccessibilityTip({ title, children }: AccessibilityTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs cursor-help hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`Accessibility tip about ${title}`}
      >
        ?
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-64 mt-2 -translate-x-1/2 left-1/2 px-4 py-3 text-sm text-slate-700 bg-white rounded-lg shadow-lg">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-blue-700 mb-1">{title}</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close tooltip"
            >
              ×
            </button>
          </div>
          <div className="text-slate-600">{children}</div>
        </div>
      )}
    </div>
  );
} 