import React, { useState } from 'react';
import { WhiteBeltPlayground } from './WhiteBeltPlayground';
import { OrangeBeltPlayground } from './OrangeBeltPlayground';
import { Award, Cpu } from 'lucide-react';

export const MasteryPlayground: React.FC = () => {
  const [level, setLevel] = useState<'white' | 'orange'>('white');

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Level sub-selector navigation */}
      <div className="bg-gray-950/60 border-b border-gray-900 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start h-12 gap-4">
            <button
              onClick={() => setLevel('white')}
              className={`flex items-center gap-2 px-4 h-full text-xs font-bold transition-all border-b-2 ${
                level === 'white'
                  ? 'border-accent-purple text-white bg-accent-purple/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/40'
              }`}
            >
              <Award className="h-4 w-4 text-accent-purple" />
              <span>🥋 LEVEL 1: WHITE BELT</span>
            </button>
            
            <button
              onClick={() => setLevel('orange')}
              className={`flex items-center gap-2 px-4 h-full text-xs font-bold transition-all border-b-2 ${
                level === 'orange'
                  ? 'border-accent-cyan text-white bg-accent-cyan/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/40'
              }`}
            >
              <Cpu className="h-4 w-4 text-accent-cyan" />
              <span>🍊 LEVEL 2: ORANGE BELT</span>
            </button>
          </div>
        </div>
      </div>

      <div className="transition-all duration-300">
        {level === 'white' ? <WhiteBeltPlayground /> : <OrangeBeltPlayground />}
      </div>
    </div>
  );
};
