import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandData, ParticleTemplate } from '../types';

interface ParticleSystemProps {
  handData: HandData;
}

const PARTICLE_COUNT = 5000;

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ handData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const originalPositions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      originalPositions[i * 3] = positions[i * 3];
      originalPositions[i * 3 + 1] = positions[i * 3 + 1];
      originalPositions[i * 3 + 2] = positions[i * 3 + 2];

      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();

      sizes[i] = Math.random() * 0.05 + 0.01;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { positions, colors, sizes, velocities, originalPositions };
  }, []);

  const targetPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const currentTemplate = useRef<ParticleTemplate>('sphere');

  const updateTargetPositions = (template: ParticleTemplate) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let x = 0, y = 0, z = 0;

      if (template === 'sphere') {
        const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
        const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
        x = Math.cos(theta) * Math.sin(phi);
        y = Math.sin(theta) * Math.sin(phi);
        z = Math.cos(phi);
      } else if (template === 'heart') {
        const t = (i / PARTICLE_COUNT) * Math.PI * 2;
        // 3D Heart formula
        const u = (Math.random() - 0.5) * 2 * Math.PI;
        const v = (Math.random() - 0.5) * 2 * Math.PI;
        
        // Parametric heart
        x = 16 * Math.pow(Math.sin(t), 3);
        y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        z = (Math.random() - 0.5) * 5;
        
        x *= 0.1;
        y *= 0.1;
      } else if (template === 'flower') {
        const t = (i / PARTICLE_COUNT) * Math.PI * 2;
        const k = 5; // petals
        const r = Math.sin(k * t);
        x = r * Math.cos(t);
        y = r * Math.sin(t);
        z = (Math.random() - 0.5) * 0.5;
        
        x *= 2;
        y *= 2;
      } else if (template === 'fireworks') {
        // Random explosion points
        const r = Math.random() * 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      }

      targetPositions[i * 3] = x;
      targetPositions[i * 3 + 1] = y;
      targetPositions[i * 3 + 2] = z;
    }
  };

  useEffect(() => {
    updateTargetPositions(handData.gesture);
    currentTemplate.current = handData.gesture;
  }, [handData.gesture]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const time = state.clock.getElapsedTime();

    const expansion = 1 + (1 - handData.pinchDistance) * 3;
    const lerpSpeed = 0.05;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Lerp to target position
      const tx = targetPositions[i3] * expansion;
      const ty = targetPositions[i3 + 1] * expansion;
      const tz = targetPositions[i3 + 2] * expansion;

      positions[i3] += (tx - positions[i3]) * lerpSpeed;
      positions[i3 + 1] += (ty - positions[i3 + 1]) * lerpSpeed;
      positions[i3 + 2] += (tz - positions[i3 + 2]) * lerpSpeed;

      // Add some noise/float
      positions[i3] += Math.sin(time + i) * 0.002;
      positions[i3 + 1] += Math.cos(time + i) * 0.002;

      // Dynamic color based on position and hand
      if (handData.isHandVisible) {
        colors[i3] = 0.5 + 0.5 * Math.sin(time + positions[i3]);
        colors[i3 + 1] = 0.5 + 0.5 * Math.cos(time + positions[i3 + 1]);
        colors[i3 + 2] = 0.8;
      } else {
        // Default colors
        colors[i3] = 0.2 + 0.3 * Math.sin(time * 0.5 + i);
        colors[i3 + 1] = 0.2 + 0.3 * Math.cos(time * 0.5 + i);
        colors[i3 + 2] = 0.5;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;

    // Smoothly follow hand position
    if (handData.isHandVisible) {
      pointsRef.current.position.x += (handData.position.x - pointsRef.current.position.x) * 0.1;
      pointsRef.current.position.y += (handData.position.y - pointsRef.current.position.y) * 0.1;
      pointsRef.current.position.z += (handData.position.z - pointsRef.current.position.z) * 0.1;
      
      pointsRef.current.rotation.x += (handData.rotation.x - pointsRef.current.rotation.x) * 0.05;
      pointsRef.current.rotation.y += (handData.rotation.y - pointsRef.current.rotation.y) * 0.05;
    } else {
      pointsRef.current.rotation.y += 0.005;
      pointsRef.current.position.x *= 0.95;
      pointsRef.current.position.y *= 0.95;
      pointsRef.current.position.z *= 0.95;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
