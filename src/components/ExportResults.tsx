import { useRef, useState } from 'react';
import jsPDF from 'jspdf';

interface ExportResultsProps {
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagAA: {
    normal: boolean;
    large: boolean;
  };
  wcagAAA: {
    normal: boolean;
    large: boolean;
  };
}

export default function ExportResults({
  foregroundColor,
  backgroundColor,
  contrastRatio,
  wcagAA,
  wcagAAA
}: ExportResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const exportAsImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showStatus('Failed to create image export.');
      return;
    }

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('Contrast Check Results', 70, 90);

    ctx.fillStyle = '#334155';
    ctx.font = '34px sans-serif';
    ctx.fillText(`Foreground: ${foregroundColor}`, 70, 165);
    ctx.fillText(`Background: ${backgroundColor}`, 70, 215);
    ctx.fillText(`Contrast Ratio: ${contrastRatio.toFixed(2)}:1`, 70, 265);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(70, 320, 1260, 300);
    ctx.fillStyle = foregroundColor;
    ctx.font = 'bold 68px sans-serif';
    ctx.fillText('Sample Text', 120, 435);
    ctx.font = '42px sans-serif';
    ctx.fillText('The quick brown fox jumps over the lazy dog.', 120, 520);

    ctx.fillStyle = '#0F172A';
    ctx.font = '30px sans-serif';
    ctx.fillText(`AA: ${wcagAA.normal ? 'Pass' : 'Fail'} (Normal), ${wcagAA.large ? 'Pass' : 'Fail'} (Large)`, 70, 700);
    ctx.fillText(`AAA: ${wcagAAA.normal ? 'Pass' : 'Fail'} (Normal), ${wcagAAA.large ? 'Pass' : 'Fail'} (Large)`, 70, 750);

    canvas.toBlob((blob) => {
      if (!blob) {
        showStatus('Failed to generate image export.');
        return;
      }
      downloadBlob(blob, `contrast-results-${Date.now()}.png`);
      showStatus('Image exported.');
    }, 'image/png');
  };
  
  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Contrast Check Results', 14, 20);

    doc.setFontSize(12);
    doc.text(`Foreground: ${foregroundColor}`, 14, 35);
    doc.text(`Background: ${backgroundColor}`, 14, 43);
    doc.text(`Contrast Ratio: ${contrastRatio.toFixed(2)}:1`, 14, 51);

    doc.text(`AA: Normal ${wcagAA.normal ? 'Pass' : 'Fail'}, Large ${wcagAA.large ? 'Pass' : 'Fail'}`, 14, 65);
    doc.text(`AAA: Normal ${wcagAAA.normal ? 'Pass' : 'Fail'}, Large ${wcagAAA.large ? 'Pass' : 'Fail'}`, 14, 73);

    doc.setFillColor(245, 245, 245);
    doc.rect(14, 86, 182, 40, 'F');
    doc.setTextColor(30, 41, 59);
    doc.text('Preview Sample', 18, 96);
    doc.setFillColor(backgroundColor);
    doc.rect(18, 101, 174, 20, 'F');
    doc.setTextColor(foregroundColor);
    doc.text('The quick brown fox jumps over the lazy dog.', 20, 114);

    doc.save(`contrast-results-${Date.now()}.pdf`);
    showStatus('PDF exported.');
  };
  
  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?fg=${encodeURIComponent(foregroundColor)}&bg=${encodeURIComponent(backgroundColor)}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showStatus('Shareable link copied to clipboard.');
      })
      .catch(() => {
        showStatus('Failed to copy link. Please try again.');
      });
  };
  
  return (
    <div className="glass-morphism p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Export Results
      </h2>
      
      <div className="mb-6 grid grid-cols-3 gap-4">
        <button
          onClick={exportAsImage}
          className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10 group"
        >
          <svg className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span className="text-sm font-medium text-gray-300">Save as Image</span>
        </button>
        
        <button
          onClick={exportAsPDF}
          className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10 group"
        >
          <svg className="w-6 h-6 text-red-400 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <span className="text-sm font-medium text-gray-300">Export as PDF</span>
        </button>
        
        <button
          onClick={generateShareableLink}
          className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10 group"
        >
          <svg className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
          <span className="text-sm font-medium text-gray-300">Share Link</span>
        </button>
      </div>

      {statusMessage && (
        <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {statusMessage}
        </div>
      )}
      
      <div 
        ref={exportRef}
        className="p-6 bg-white/5 rounded-lg shadow-sm border border-white/5"
      >
        <h3 className="text-xl font-bold mb-4 text-white">Contrast Check Results</h3>
        
        <div className="flex space-x-4 mb-4">
          <div className="w-1/2">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-6 h-6 rounded-md border border-white/10 shadow-inner"
                style={{ backgroundColor: foregroundColor }}
              ></div>
              <span className="font-medium text-gray-300">Text: {foregroundColor}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-md border border-white/10 shadow-inner"
                style={{ backgroundColor: backgroundColor }}
              ></div>
              <span className="font-medium text-gray-300">Background: {backgroundColor}</span>
            </div>
          </div>
          
          <div className="w-1/2">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1 text-blue-400">{contrastRatio.toFixed(2)}:1</div>
              <div className="text-sm text-gray-400">Contrast Ratio</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-2">WCAG AA</h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAA.normal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {wcagAA.normal ? '✓' : '✗'}
                </span>
                <span>Normal text (4.5:1)</span>
              </div>
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAA.large ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {wcagAA.large ? '✓' : '✗'}
                </span>
                <span>Large text (3:1)</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <h4 className="font-medium text-purple-400 mb-2">WCAG AAA</h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAAA.normal ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {wcagAAA.normal ? '✓' : '✗'}
                </span>
                <span>Normal text (7:1)</span>
              </div>
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAAA.large ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {wcagAAA.large ? '✓' : '✗'}
                </span>
                <span>Large text (4.5:1)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-gray-500">
          Generated with Accessibility Color Checker • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
} 
