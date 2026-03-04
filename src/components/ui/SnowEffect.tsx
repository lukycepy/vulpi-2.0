
"use client";

import { useEffect, useRef } from "react";

export function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const snowflakes: { x: number; y: number; r: number; d: number; speed: number; opacity: number }[] = [];
    const maxFlakes = 150; // Increased count

    for (let i = 0; i < maxFlakes; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1, // Varied size
        d: Math.random() * maxFlakes,
        speed: Math.random() * 1 + 0.5, // Varied speed
        opacity: Math.random() * 0.5 + 0.3 // Varied opacity
      });
    }

    let animationFrameId: number;
    let angle = 0;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();

      for (let i = 0; i < maxFlakes; i++) {
        const f = snowflakes[i];
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
        ctx.fill(); // Fill each flake individually for opacity
        ctx.beginPath(); // Start new path
      }
      
      move();
      animationFrameId = requestAnimationFrame(draw);
    }

    function move() {
      angle += 0.01;
      for (let i = 0; i < maxFlakes; i++) {
        const f = snowflakes[i];
        // Gravity
        f.y += Math.pow(f.d, 2) * 0.0005 + f.speed; // Smoother fall
        // Wind
        f.x += Math.sin(angle + f.d) * 0.5;

        // Reset if out of view
        if (f.y > height) {
          snowflakes[i] = {
            x: Math.random() * width,
            y: -10, // Start slightly above
            r: f.r,
            d: f.d,
            speed: f.speed,
            opacity: f.opacity
          };
        }
        
        // Wrap around X
        if (f.x > width + 5) f.x = -5;
        if (f.x < -5) f.x = width + 5;
      }
    }

    const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener("resize", handleResize);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]"
      style={{ pointerEvents: "none" }}
    />
  );
}
