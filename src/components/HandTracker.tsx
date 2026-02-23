import { Hands, Results } from '@mediapipe/hands';
import React, { useEffect, useRef, useState } from 'react';
import { HandData, ParticleTemplate } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let hands: Hands | null = null;
    let animationId: number | null = null;
    let isMounted = true;

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser does not support camera access');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });

        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => resolve(true);
            }
          });
          await videoRef.current.play();
        }
      } catch (err) {
        if (isMounted) {
          console.error('Camera setup error:', err);
          setError(err instanceof Error ? err.message : 'Failed to access camera');
          setIsLoading(false);
        }
      }
    };

    const setupHands = async () => {
      try {
        hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: Results) => {
          if (!isMounted) return;
          setIsLoading(false);
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            const wrist = landmarks[0];
            const position = {
              x: (wrist.x - 0.5) * 10,
              y: -(wrist.y - 0.5) * 10,
              z: -wrist.z * 10
            };

            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const dist = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) +
              Math.pow(thumbTip.y - indexTip.y, 2) +
              Math.pow(thumbTip.z - indexTip.z, 2)
            );
            const pinchDistance = Math.max(0, Math.min(1, (dist - 0.02) / 0.13));

            const isExtended = (tipIdx: number, pipIdx: number) => landmarks[tipIdx].y < landmarks[pipIdx].y;
            
            const indexExtended = isExtended(8, 6);
            const middleExtended = isExtended(12, 10);
            const ringExtended = isExtended(16, 14);
            const pinkyExtended = isExtended(20, 18);

            let gesture: ParticleTemplate = 'sphere';
            const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

            if (extendedCount === 0) {
              gesture = 'fireworks';
            } else if (extendedCount === 1 && indexExtended) {
              gesture = 'flower';
            } else if (extendedCount === 2 && indexExtended && middleExtended) {
              gesture = 'heart';
            } else if (extendedCount >= 3) {
              gesture = 'sphere';
            }

            onHandUpdate({
              isHandVisible: true,
              position,
              pinchDistance,
              gesture,
              rotation: {
                x: (wrist.y - 0.5) * Math.PI,
                y: (wrist.x - 0.5) * Math.PI,
                z: 0
              }
            });
          } else {
            onHandUpdate({
              isHandVisible: false,
              position: { x: 0, y: 0, z: 0 },
              pinchDistance: 1,
              gesture: 'sphere',
              rotation: { x: 0, y: 0, z: 0 }
            });
          }
        });
      } catch (err) {
        if (isMounted) {
          console.error('Hands setup error:', err);
          setError('Failed to initialize hand tracking');
          setIsLoading(false);
        }
      }
    };

    const runTracking = async () => {
      if (!isMounted) return;
      
      if (hands && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          await hands.send({ image: videoRef.current });
        } catch (err) {
          console.error('Tracking error:', err);
        }
      }
      animationId = requestAnimationFrame(runTracking);
    };

    const init = async () => {
      await setupCamera();
      await setupHands();
      runTracking();
    };

    init();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (hands) {
        hands.close();
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [onHandUpdate]);

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 border-2 border-white/20 rounded-lg overflow-hidden bg-black/50 z-50 flex flex-col items-center justify-center">
      {error ? (
        <div className="p-2 text-center">
          <p className="text-[10px] text-red-400 font-mono uppercase leading-tight">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-[8px] uppercase tracking-widest rounded transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className={`w-full h-full object-cover scale-x-[-1] ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
            autoPlay
            playsInline
            muted
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[8px] font-mono uppercase tracking-widest opacity-40">Initializing...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
