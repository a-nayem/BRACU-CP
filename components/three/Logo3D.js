"use client";
import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { asset } from "@/lib/paths";

// The BRAC University logo on its own (no coin), spinning left to right around the vertical axis.
// The black parts of the logo are drawn off-white so they stay readable on the dark scene.
export default function Logo3D() {
  const group = useRef();
  const texture = useTexture(asset("/bracu-logo.png"));
  const { viewport } = useThree();
  const mobile = viewport.width < 6;

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  const base = useMemo(() => (mobile ? { s: 0.6, x: 0, y: -3.2 } : { s: 0.95, x: 2.5, y: 0 }), [mobile]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.position.set(base.x, Math.sin(t * 0.5) * 0.2 + base.y, 0);
    g.scale.setScalar(base.s);
    g.rotation.y = t * 0.2;                      // constant spin, left to right
    g.rotation.x = state.pointer.y * -0.15;      // mouse parallax tilt
    g.rotation.z = state.pointer.x * 0.06;
  });

  // Two planes back to back so the reverse side is not mirrored.
  const mat = { map: texture, transparent: true, alphaTest: 0.04, toneMapped: false, side: THREE.FrontSide };
  return (
    <group ref={group}>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial {...mat} />
      </mesh>
      <mesh position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial {...mat} />
      </mesh>
    </group>
  );
}
