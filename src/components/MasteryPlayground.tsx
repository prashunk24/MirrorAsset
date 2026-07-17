import React, { useState } from 'react';
import { WhiteBeltPlayground } from './WhiteBeltPlayground';
import { OrangeBeltPlayground } from './OrangeBeltPlayground';
import { Award, Cpu } from 'lucide-react';

export const MasteryPlayground: React.FC = () => {
  const [level, setLevel] = useState<'white' | 'orange'>('white');

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Level sub-selector navigation */}
      <div className="bg-bg-surface/60 border-b border-border-subtle sticky top-16 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start h-12 gap-1">
            <button
              onClick={() => setLevel('white')}
              className={`flex items-center gap-2 px-5 h-full text-xs font-bold transition-all duration-200 border-b-2 cursor-pointer ${
                level === 'white'
                  ? 'border-accent-purple text-text-primary bg-accent-purple/5 shadow-[0_2px_8px_-2px] shadow-accent-purple/30'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-card-hover'
              }`}
            >
              <Award className={`h-4 w-4 ${level === 'white' ? 'text-accent-purple' : 'text-text-muted'}`} />
              <span>🥋 LEVEL 1: WHITE BELT</span>
            </button>
            
            <button
              onClick={() => setLevel('orange')}
              className={`flex items-center gap-2 px-5 h-full text-xs font-bold transition-all duration-200 border-b-2 cursor-pointer ${
                level === 'orange'
                  ? 'border-accent-cyan text-text-primary bg-accent-cyan/5 shadow-[0_2px_8px_-2px] shadow-accent-cyan/30'
                  : 'border-transparent text-text-muted hover:text-text-secondary hover:bg-bg-card-hover'
              }`}
            >
              <Cpu className={`h-4 w-4 ${level === 'orange' ? 'text-accent-cyan' : 'text-text-muted'}`} />
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
