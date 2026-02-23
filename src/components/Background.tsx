import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandData } from '../types';

interface BackgroundProps {
  handData: HandData;
}

export const Background: React.FC<BackgroundProps> = ({ handData }) => {
  const count = 150;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.005 + Math.random() / 500;
      const xFactor = -40 + Math.random() * 80;
      const yFactor = -40 + Math.random() * 80;
      const zFactor = -60 + Math.random() * 40;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, baseColor: new THREE.Color('#1a1a1a') });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const _color = useMemo(() => new THREE.Color(), []);
  const _vec = useMemo(() => new THREE.Vector3(), []);
  const _handPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    _handPos.set(handData.position.x, handData.position.y, handData.position.z);
    const isHandActive = handData.isHandVisible;

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed;
      
      // Base floating position
      const bx = xFactor + Math.cos((t / 10) * factor) * 2;
      const by = yFactor + Math.sin((t / 10) * factor) * 2;
      const bz = zFactor + Math.cos((t / 10) * factor) * 2;
      
      _vec.set(bx, by, bz);
      
      // Interaction
      let colorIntensity = 0;
      if (isHandActive) {
        const dist = _vec.distanceTo(_handPos);
        const threshold = 5;
        if (dist < threshold) {
          // Repulsion
          const force = (1 - dist / threshold) * 2;
          const dir = _vec.clone().sub(_handPos).normalize();
          _vec.add(dir.multiplyScalar(force));
          colorIntensity = force;
        }
      }

      dummy.position.copy(_vec);
      const s = 0.5 + Math.cos(t) * 0.2;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Color reaction
      if (colorIntensity > 0.1) {
        _color.set('#34d399').lerp(new THREE.Color('#1a1a1a'), 1 - colorIntensity);
      } else {
        _color.set('#1a1a1a');
      }
      meshRef.current!.setColorAt(i, _color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial transparent opacity={0.4} />
    </instancedMesh>
  );
};
