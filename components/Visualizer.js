"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  Float,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";

function Scene({ reducedMotion }) {
  const coreRef = useRef();
  const ringRef = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state) => {
    if (!coreRef.current || !ringRef.current) return;

    if (reducedMotion) {
      coreRef.current.rotation.x = 0;
      coreRef.current.rotation.y = 0;
      coreRef.current.position.y = 0;
      return;
    }

    const t = state.clock.getElapsedTime();

    // Smoothly follow mouse
    coreRef.current.rotation.x = THREE.MathUtils.lerp(
      coreRef.current.rotation.x,
      state.mouse.y * 0.8,
      0.1
    );
    coreRef.current.rotation.y = THREE.MathUtils.lerp(
      coreRef.current.rotation.y,
      state.mouse.x * 0.8,
      0.1
    );

    // Ring rotation speed increases on hover
    ringRef.current.rotation.z += hovered ? 0.05 : 0.01;

    // Floating movement
    coreRef.current.position.y = Math.sin(t) * 0.1;
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />

      {/* Lighting setup for the "3D" look */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00f2ff" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#7000ff" />
      <spotLight position={[0, 5, 0]} intensity={2} />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* The Obsidian Core */}
        <mesh
          ref={coreRef}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
        >
          <icosahedronGeometry args={[1, 0]} />
          <MeshDistortMaterial
            color={hovered ? "#222" : "#050505"}
            speed={3}
            distort={0.4}
            metalness={1}
            roughness={0.1}
          />
        </mesh>

        {/* The Pulsing Security Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 1.8, 0, 0]}>
          <torusGeometry args={[1.8, 0.03, 16, 100]} />
          <MeshWobbleMaterial
            color={hovered ? "#ffffff" : "#00f2ff"}
            factor={hovered ? 0.8 : 0.2}
            speed={2}
            emissive={hovered ? "#00f2ff" : "#0044ff"}
            emissiveIntensity={hovered ? 10 : 2}
          />
        </mesh>
      </Float>
    </>
  );
}

export default function Visualizer() {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    setIsWebGLSupported(Boolean(gl));

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  if (!isWebGLSupported) {
    return (
      <div className="la-visualizer-fallback">
        WebGL unavailable. Secure core visuals disabled.
      </div>
    );
  }

  return (
    <div className="la-visualizer">
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <Scene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
