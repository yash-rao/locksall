"use client";

import { useEffect, useRef } from "react";

export default function PremiumSnow() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
      canvas.width = Math.floor(window.innerWidth * DPR);
      canvas.height = Math.floor(window.innerHeight * DPR);
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    // Make snow clearly visible: mix of big + small flakes
    const FLAKES = [];
    const COUNT = 160;

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function makeFlake(isNear = false) {
      const r = isNear ? rand(2.2, 5.5) : rand(0.8, 2.2);
      return {
        x: rand(0, window.innerWidth),
        y: rand(-window.innerHeight, 0),
        r,
        vy: isNear ? rand(0.9, 2.2) : rand(0.35, 1.0),
        vx: isNear ? rand(-0.6, 0.9) : rand(-0.25, 0.35),
        sway: rand(0.6, 1.8),
        phase: rand(0, Math.PI * 2),
        a: isNear ? rand(0.75, 0.95) : rand(0.35, 0.6),
        glow: isNear ? rand(6, 12) : rand(2, 6),
      };
    }

    // 70% far, 30% near
    for (let i = 0; i < COUNT; i++) {
      FLAKES.push(makeFlake(i > COUNT * 0.7));
    }

    let t = 0;

    function draw() {
      t += 0.01;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const f of FLAKES) {
        // movement
        f.y += f.vy;
        f.x += f.vx + Math.sin(t * f.sway + f.phase) * 0.35;

        // reset
        if (f.y - f.r > window.innerHeight) {
          f.y = rand(-80, -10);
          f.x = rand(0, window.innerWidth);
        }
        if (f.x < -30) f.x = window.innerWidth + 30;
        if (f.x > window.innerWidth + 30) f.x = -30;

        // glow + flake
        ctx.save();
        ctx.globalAlpha = f.a;

        // icy glow (premium look)
        ctx.shadowBlur = f.glow;
        ctx.shadowColor = "rgba(190,235,255,0.65)";

        // fill (slight blue tint)
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Icy wash to push theme to snow/ice */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 15% 10%, rgba(140,220,255,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(120,160,255,0.14), transparent 45%)",
          mixBlendMode: "screen",
        }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,          // ✅ always on top
          pointerEvents: "none", // ✅ no click blocking
        }}
      />
    </>
  );
}
