"use client";
import { useRef, useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { asset } from "@/lib/paths";

// Soft blue glow behind the badge so it separates from both light and dark backgrounds.
function Halo({ x, y, s }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const r = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    r.addColorStop(0, "rgba(40,88,168,0.40)");
    r.addColorStop(0.55, "rgba(40,88,168,0.12)");
    r.addColorStop(1, "rgba(40,88,168,0)");
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <mesh position={[x, y, -0.8]} scale={s} renderOrder={-10}>
      <planeGeometry args={[9, 9]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
  );
}

// The BRAC University logo on a round badge. The badge spins left to right around the vertical axis.
export default function Logo3D() {
  const group = useRef();
  const texture = useTexture(asset("/bracu-logo.png"));
  const { viewport, gl } = useThree();
  const mobile = viewport.width < 6;

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }, [texture, gl]);

  const base = useMemo(() => (mobile ? { s: 0.52, x: 0, y: -3.3 } : { s: 0.765, x: 2.5, y: 0 }), [mobile]);

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

  const face = (
    <meshBasicMaterial map={texture} toneMapped={false} />
  );
  const rim = <meshStandardMaterial color="#2858a8" metalness={0.5} roughness={0.3} emissive="#2858a8" emissiveIntensity={0.3} />;

  return (
    <>
      <Halo x={base.x} y={base.y} s={base.s * 1.15} />
      <group ref={group}>
        {/* slim steel-blue edge */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.8, 2.8, 0.22, 128]} />
          <meshStandardMaterial color="#7f98bd" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.112]}><circleGeometry args={[2.8, 128]} />{face}</mesh>
        <mesh position={[0, 0, -0.112]} rotation={[0, Math.PI, 0]}><circleGeometry args={[2.8, 128]} />{face}</mesh>
        <mesh position={[0, 0, 0.116]}><ringGeometry args={[2.66, 2.8, 128]} />{rim}</mesh>
        <mesh position={[0, 0, -0.116]} rotation={[0, Math.PI, 0]}><ringGeometry args={[2.66, 2.8, 128]} />{rim}</mesh>
      </group>
    </>
  );
}
