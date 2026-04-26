import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Float, Environment } from '@react-three/drei';

function AnimatedCrystal() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.rotation.x += delta * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[2.5, 0]} />
        <meshStandardMaterial 
          color="#06b6d4" 
          transparent={true} 
          opacity={0.6} 
          metalness={0.5} 
          roughness={0.2} 
        />
      </mesh>
    </Float>
  );
}

export default function Dashboard3D() {
  return (
    <div style={{ height: '100%', width: '100%', position: 'absolute', right: 0, top: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#2563eb" />
        <AnimatedCrystal />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
