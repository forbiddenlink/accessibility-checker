export default function FontSizeAccessibility() {
  return (
    <div className="glass-morphism p-6 rounded-xl mb-8">
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Text Size & Accessibility
      </h2>
      
      <div className="space-y-6">
        <p className="text-slate-700">
          WCAG guidelines have different contrast requirements based on text size. Here's how text size relates to contrast requirements:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-slate-800">Normal Text</h3>
            <div className="flex mb-4">
              <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mr-4">
                <span className="text-lg">Aa</span>
              </div>
              <div>
                <p className="text-slate-700 mb-1">Less than 18pt (24px) or</p>
                <p className="text-slate-700 mb-1">Less than 14pt (18.6px) if bold</p>
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">4.5:1 for AA</span>
                  <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">7:1 for AAA</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
              Most body text on websites falls into this category, including paragraphs, lists, table content, and navigation links.
            </div>
          </div>
          
          <div className="bg-white/50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-slate-800">Large Text</h3>
            <div className="flex mb-4">
              <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-50 rounded-lg mr-4">
                <span className="text-2xl">Aa</span>
              </div>
              <div>
                <p className="text-slate-700 mb-1">At least 18pt (24px) or</p>
                <p className="text-slate-700 mb-1">At least 14pt (18.6px) if bold</p>
                <div className="mt-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">3:1 for AA</span>
                  <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">4.5:1 for AAA</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
              Larger text is generally used for headings, titles, and emphasized content that needs to stand out on the page.
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Font Size Tip</h3>
          <p className="text-slate-700">
            When designing, remember that the actual perceived size of text depends on the specific font family used. Some fonts appear smaller at the same pixel size compared to others.
          </p>
        </div>
        
        <div className="mt-4 flex justify-center">
          <a 
            href="https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center font-medium"
          >
            WCAG 2.1 Contrast Guidelines
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 