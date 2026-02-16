export default function WcagInformation() {
  return (
    <div className="glass-morphism p-6 rounded-xl mb-8">
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Understanding WCAG Contrast Requirements
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center text-white">
            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm mr-3 border border-blue-500/20">AA</span>
            WCAG 2.1 Level AA
          </h3>
          <p className="text-gray-300 mb-2">
            Level AA is the standard level of compliance that most websites should aim for:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-400">
            <li>Normal text (below 18pt or 14pt bold): Minimum contrast ratio of 4.5:1</li>
            <li>Large text (at least 18pt or 14pt bold): Minimum contrast ratio of 3:1</li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center text-white">
            <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm mr-3 border border-purple-500/20">AAA</span>
            WCAG 2.1 Level AAA
          </h3>
          <p className="text-gray-300 mb-2">
            Level AAA is the highest level of compliance, providing enhanced accessibility:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-400">
            <li>Normal text (below 18pt or 14pt bold): Minimum contrast ratio of 7:1</li>
            <li>Large text (at least 18pt or 14pt bold): Minimum contrast ratio of 4.5:1</li>
          </ul>
        </div>
        
        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
          <h3 className="text-lg font-medium mb-2 text-blue-400">Why Contrast Matters</h3>
          <p className="text-gray-300">
            Sufficient contrast between text and its background is essential for people with low vision, color 
            blindness, or who are viewing screens in bright environments. Good contrast benefits all users by 
            making content more readable and reducing eye strain.
          </p>
        </div>
        
        <div className="text-center mt-4">
          <a
            href="https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center transition-colors"
          >
            Learn more about WCAG contrast guidelines
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 