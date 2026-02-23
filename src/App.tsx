import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { HandTracker } from './components/HandTracker';
import { ParticleSystem } from './components/ParticleSystem';
import { Background } from './components/Background';
import { HandData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Hand, Sparkles, Heart, Flower2, Zap } from 'lucide-react';

export default function App() {
  const [handData, setHandData] = useState<HandData>({
    isHandVisible: false,
    position: { x: 0, y: 0, z: 0 },
    pinchDistance: 1,
    gesture: 'sphere',
    rotation: { x: 0, y: 0, z: 0 }
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans text-white">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <color attach="background" args={['#050505']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          
          <Background handData={handData} />
          <ParticleSystem handData={handData} />
          
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
          </EffectComposer>
          
          <OrbitControls enablePan={false} enableZoom={true} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        {/* Header */}
        <header className="flex justify-between items-start">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1"
          >
            <h1 className="text-4xl font-bold tracking-tighter uppercase italic">Aura Particles</h1>
            <p className="text-xs font-mono uppercase tracking-widest opacity-50">Hand-Gesture Controlled 3D System</p>
          </motion.div>

          <div className="flex gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${handData.isHandVisible ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`} />
              <span className="text-[10px] font-mono uppercase tracking-wider">
                {handData.isHandVisible ? 'Tracking Active' : 'Searching for Hand'}
              </span>
            </div>
          </div>
        </header>

        {/* Center Hint */}
        <AnimatePresence>
          {!handData.isHandVisible && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center animate-pulse">
                <Hand className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-medium opacity-40 uppercase tracking-[0.2em]">Show your hand to the camera</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Controls Info */}
        <footer className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="flex gap-2">
              <ControlHint icon={<Zap className="w-3 h-3" />} label="Pinch" action="Expand" />
              <ControlHint icon={<Hand className="w-3 h-3" />} label="Move" action="Position" />
            </div>
            
            <div className="flex gap-4">
              <GestureIcon active={handData.gesture === 'sphere'} icon={<Sparkles />} label="Sphere" sub="Open Hand" />
              <GestureIcon active={handData.gesture === 'heart'} icon={<Heart />} label="Heart" sub="Peace Sign" />
              <GestureIcon active={handData.gesture === 'flower'} icon={<Flower2 />} label="Flower" sub="Point" />
              <GestureIcon active={handData.gesture === 'fireworks'} icon={<Zap />} label="Chaos" sub="Fist" />
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-mono uppercase opacity-30">System v1.0.4</p>
            <p className="text-[10px] font-mono uppercase opacity-30">Three.js + MediaPipe</p>
          </div>
        </footer>
      </div>

      {/* Hand Tracker Feed */}
      <HandTracker onHandUpdate={handleHandUpdate} />
    </div>
  );
}

function ControlHint({ icon, label, action }: { icon: React.ReactNode, label: string, action: string }) {
  return (
    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md backdrop-blur-sm flex items-center gap-2">
      <span className="opacity-60">{icon}</span>
      <span className="text-[10px] font-mono uppercase tracking-wider">
        <span className="opacity-40">{label}:</span> {action}
      </span>
    </div>
  );
}

function GestureIcon({ active, icon, label, sub }: { active: boolean, icon: React.ReactNode, label: string, sub: string }) {
  return (
    <motion.div 
      animate={{ 
        backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.02)',
        borderColor: active ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
      }}
      className="p-3 rounded-xl border flex flex-col items-center gap-1 min-w-[70px] backdrop-blur-sm"
    >
      <div className={`transition-colors duration-300 ${active ? 'text-emerald-400' : 'text-white/40'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-tighter ${active ? 'text-white' : 'text-white/30'}`}>{label}</span>
      <span className="text-[7px] font-mono uppercase opacity-20">{sub}</span>
    </motion.div>
  );
}
