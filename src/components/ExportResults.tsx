import { useRef } from 'react';

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
  
  const exportAsImage = () => {
    if (!exportRef.current) return;
    
    // In a real implementation, you would use a library like html2canvas
    // to capture the div contents as an image
    alert('In a real implementation, this would generate and download an image of the results.');
  };
  
  const exportAsPDF = () => {
    if (!exportRef.current) return;
    
    // In a real implementation, you would use a library like jsPDF
    // to generate a PDF from the div contents
    alert('In a real implementation, this would generate and download a PDF of the results.');
  };
  
  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}?fg=${encodeURIComponent(foregroundColor)}&bg=${encodeURIComponent(backgroundColor)}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('Shareable link copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy link. Please try again.');
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
          className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
        >
          <svg className="w-6 h-6 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span className="text-sm font-medium">Save as Image</span>
        </button>
        
        <button
          onClick={exportAsPDF}
          className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
        >
          <svg className="w-6 h-6 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <span className="text-sm font-medium">Export as PDF</span>
        </button>
        
        <button
          onClick={generateShareableLink}
          className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-lg hover:bg-white/80 transition-colors"
        >
          <svg className="w-6 h-6 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
          <span className="text-sm font-medium">Share Link</span>
        </button>
      </div>
      
      <div 
        ref={exportRef}
        className="p-6 bg-white rounded-lg shadow-sm"
      >
        <h3 className="text-xl font-bold mb-4">Contrast Check Results</h3>
        
        <div className="flex space-x-4 mb-4">
          <div className="w-1/2">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-6 h-6 rounded-md" 
                style={{ backgroundColor: foregroundColor }}
              ></div>
              <span className="font-medium">Text: {foregroundColor}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-md" 
                style={{ backgroundColor: backgroundColor }}
              ></div>
              <span className="font-medium">Background: {backgroundColor}</span>
            </div>
          </div>
          
          <div className="w-1/2">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1 text-blue-600">{contrastRatio.toFixed(2)}:1</div>
              <div className="text-sm text-slate-600">Contrast Ratio</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">WCAG AA</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAA.normal ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {wcagAA.normal ? '✓' : '✗'}
                </span>
                <span>Normal text (4.5:1)</span>
              </div>
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAA.large ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {wcagAA.large ? '✓' : '✗'}
                </span>
                <span>Large text (3:1)</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">WCAG AAA</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAAA.normal ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {wcagAAA.normal ? '✓' : '✗'}
                </span>
                <span>Normal text (7:1)</span>
              </div>
              <div className="flex items-center">
                <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${wcagAAA.large ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {wcagAAA.large ? '✓' : '✗'}
                </span>
                <span>Large text (4.5:1)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
          Generated with Accessibility Color Checker • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
} 