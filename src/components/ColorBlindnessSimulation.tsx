import { useState } from 'react';

interface ColorBlindnessSimulationProps {
  foregroundColor: string;
  backgroundColor: string;
}

export default function ColorBlindnessSimulation({
  foregroundColor,
  backgroundColor
}: ColorBlindnessSimulationProps) {
  const [simulationType, setSimulationType] = useState<string>('normal');
  
  // Matrix values for simulating different types of color blindness
  const simulationFilters = {
    normal: 'none',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)',
    achromatopsia: 'grayscale(100%)'
  };
  
  return (
    <div className="glass-morphism p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
        Color Blindness Simulation
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {Object.keys(simulationFilters).map(type => (
          <button
            key={type}
            onClick={() => setSimulationType(type)}
            className={`py-2 px-4 rounded-lg transition-all border ${
              simulationType === type 
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="mt-6">
        <div 
          className="p-6 rounded-lg shadow-sm transition-all"
          style={{
            backgroundColor,
            color: foregroundColor,
            filter: simulationFilters[simulationType as keyof typeof simulationFilters]
          }}
        >
          <h3 className="text-2xl font-bold mb-2">Sample Text</h3>
          <p className="text-base">This is how the text would appear to someone with {simulationType === 'normal' ? 'normal vision' : simulationType}.</p>
        </div>
      </div>
      
      {/* SVG Filters for Color Blindness Simulation */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                      0.7,   0.3,   0,   0, 0
                      0,     0.3,   0.7, 0, 0
                      0,     0,     0,   1, 0"
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                      0,    0.433, 0.567, 0, 0
                      0,    0.475, 0.525, 0, 0
                      0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
} 