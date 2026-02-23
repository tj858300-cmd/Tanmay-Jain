export type ParticleTemplate = 'sphere' | 'heart' | 'flower' | 'fireworks';

export interface HandData {
  isHandVisible: boolean;
  position: { x: number; y: number; z: number };
  pinchDistance: number; // 0 to 1
  gesture: ParticleTemplate;
  rotation: { x: number; y: number; z: number };
}

export interface AppState {
  handData: HandData;
}
