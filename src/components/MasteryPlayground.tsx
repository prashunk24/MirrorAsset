import React, { useState } from 'react';
import { WhiteBeltPlayground } from './WhiteBeltPlayground';
import { OrangeBeltPlayground } from './OrangeBeltPlayground';
import { Award, Cpu } from 'lucide-react';

export const MasteryPlayground: React.FC = () => {
  const [level, setLevel] = useState<'white' | 'orange'>('white');

  return (
    <div className="min-h-screen bg-[#090A0F]">
      {/* Level sub-selector navigation
          sticky top-[80px] because App.tsx <main> has pt-20 (80px) which
          already compensates for the 64px pill navbar + 16px gap. */}
      <div
        className="sticky top-[80px] z-30 backdrop-blur-xl"
        style={{ background: 'rgba(9,10,15,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* overflow-x-auto + no-scrollbar so tabs scroll on 320px screens */}
          <div className="flex items-center overflow-x-auto no-scrollbar gap-1 py-1">
            <button
              onClick={() => setLevel('white')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs font-bold rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 cursor-pointer ${
                level === 'white'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={level === 'white'
                ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.40)', boxShadow: '0 0 12px rgba(139,92,246,0.20)' }
                : { background: 'transparent', border: '1px solid transparent' }
              }
            >
              <Award className={`h-4 w-4 flex-shrink-0 ${ level === 'white' ? 'text-violet-400' : 'text-slate-600'}`} />
              <span>🥋 LEVEL 1: WHITE BELT</span>
            </button>

            <button
              onClick={() => setLevel('orange')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs font-bold rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 cursor-pointer ${
                level === 'orange'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={level === 'orange'
                ? { background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.38)', boxShadow: '0 0 12px rgba(6,182,212,0.18)' }
                : { background: 'transparent', border: '1px solid transparent' }
              }
            >
              <Cpu className={`h-4 w-4 flex-shrink-0 ${ level === 'orange' ? 'text-cyan-400' : 'text-slate-600'}`} />
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
