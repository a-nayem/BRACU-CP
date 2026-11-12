"use client";
import { Component, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Logo3D from "./Logo3D";
import FloatingParticles from "./FloatingParticles";
import WireframeTerrain from "./WireframeTerrain";

// If the HDR environment cannot be fetched (offline), keep the scene instead of crashing it.
class Safe extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function ThreeScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        aria-hidden="true"
      >
        <color attach="background" args={["#030610"]} />
        <fog attach="fog" args={["#030610", 8, 30]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#5b8bd4" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#2858a8" />
        <directionalLight position={[0, 5, 5]} intensity={1.5} color="#ffffff" />
        <Suspense fallback={null}>
          <Safe><Environment preset="city" /></Safe>
          <Logo3D />
          <FloatingParticles />
          <WireframeTerrain />
        </Suspense>
      </Canvas>
      {/* vignette blending the edges into the page */}
      <div
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_rgba(3,6,16,0.9)]"
        style={{ background: "radial-gradient(circle at 70% 50%, rgba(40,88,168,0.12), transparent 60%)" }}
      />
    </div>
  );
}
