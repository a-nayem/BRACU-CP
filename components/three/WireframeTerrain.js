"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function WireframeTerrain() {
  const ref = useRef();
  useFrame((state) => {
    // the grid has a 2-unit period, so wrapping position.z loops seamlessly
    ref.current.position.z = (state.clock.elapsedTime * 2) % 2;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshBasicMaterial color="#5b8bd4" wireframe transparent opacity={0.1} />
    </mesh>
  );
}
