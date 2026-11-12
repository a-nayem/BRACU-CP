"use client";
import { useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const COUNT = 200;
// Generated at module level so render stays pure.
const DATA = Array.from({ length: COUNT }, () => ({
  x: (Math.random() - 0.5) * 35,
  y: (Math.random() - 0.5) * 35,
  z: (Math.random() - 0.5) * 30 - 10, // keeps particles behind the camera (camera z = 10)
  s: 0.05 + Math.random() * 0.18,
  r: 0.2 + Math.random() * 0.6,
  p: Math.random() * Math.PI * 2,
}));

export default function FloatingParticles({ dark = true }) {
  const mesh = useRef();
  const group = useRef();
  const dummy = useRef(new THREE.Object3D());

  useLayoutEffect(() => {
    DATA.forEach((d, i) => {
      dummy.current.position.set(d.x, d.y, d.z);
      dummy.current.scale.setScalar(d.s);
      dummy.current.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.current.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const o = dummy.current;
    DATA.forEach((d, i) => {
      o.position.set(d.x + Math.sin(t * 0.2 + d.p) * 0.6, d.y + Math.cos(t * 0.25 + d.p) * 0.6, d.z);
      o.rotation.set(t * d.r, t * d.r * 0.7, 0);
      o.scale.setScalar(d.s);
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    // shift the whole cloud against the pointer
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, -state.pointer.x * 0.8, 0.05);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -state.pointer.y * 0.8, 0.05);
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[null, null, COUNT]}>
        <icosahedronGeometry args={[1, 0]} />
        {dark ? (
          <meshStandardMaterial color="#050a1a" emissive="#2858a8" emissiveIntensity={0.6} roughness={0.1} metalness={0.9} />
        ) : (
          <meshStandardMaterial color="#8fb2e6" emissive="#2858a8" emissiveIntensity={0.12} roughness={0.35} metalness={0.25} transparent opacity={0.6} />
        )}
      </instancedMesh>
    </group>
  );
}
