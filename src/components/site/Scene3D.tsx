import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Intensity = "low" | "medium" | "high";

const COUNTS: Record<Intensity, number> = { low: 400, medium: 1100, high: 2200 };

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18 - 4;
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.015;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#7aa7ff" transparent opacity={0.75} sizeAttenuation />
    </points>
  );
}

function Wire({
  position,
  scale,
  speed,
  geometry,
  color,
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
  geometry: "ico" | "torus" | "octa";
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed;
    ref.current.rotation.y += delta * speed * 0.7;
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      {geometry === "ico" && <icosahedronGeometry args={[1, 1]} />}
      {geometry === "torus" && <torusGeometry args={[1, 0.32, 8, 32]} />}
      {geometry === "octa" && <octahedronGeometry args={[1, 0]} />}
      <meshBasicMaterial color={color} wireframe transparent opacity={0.22} />
    </mesh>
  );
}

export default function Scene3D({ intensity = "medium" }: { intensity?: Intensity }) {
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const level: Intensity = isSmall ? "low" : intensity;
  const count = COUNTS[level];

  return (
    <Canvas
      aria-hidden
      dpr={[1, isSmall ? 1.4 : 1.8]}
      camera={{ position: [0, 0, 9], fov: 55 }}
      gl={{ antialias: !isSmall, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <fog attach="fog" args={["#08090d", 10, 26]} />
      <Particles count={count} />
      <Wire position={[-5.5, 1.8, -3]} scale={1.6} speed={0.12} geometry="ico" color="#5b8cff" />
      <Wire position={[5.6, -1.6, -4]} scale={1.9} speed={0.09} geometry="torus" color="#9a6bff" />
      {level !== "low" && (
        <Wire position={[3.2, 2.6, -6]} scale={1.2} speed={0.15} geometry="octa" color="#5b8cff" />
      )}
    </Canvas>
  );
}
