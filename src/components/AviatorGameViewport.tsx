/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Trophy, MonitorPlay } from 'lucide-react';

interface AviatorGameViewportProps {
  crashActive: boolean;
  crashMultiplier: number;
  crashStatusMessage: string;
  countdownValue: number | null;
  onlinePlayersCount: number;
  avatarList: string[];
  authSessionMode?: 'demo' | 'real' | null;
}

export default function AviatorGameViewport({
  crashActive,
  crashMultiplier,
  crashStatusMessage,
  countdownValue,
  onlinePlayersCount,
  avatarList,
  authSessionMode
}: AviatorGameViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  // Mirror props to mutable refs so the 60FPS high-performance animation loop runs steadily without teardown
  const crashActiveRef = useRef(crashActive);
  const crashMultiplierRef = useRef(crashMultiplier);
  const crashStatusMessageRef = useRef(crashStatusMessage);

  useEffect(() => {
    crashActiveRef.current = crashActive;
  }, [crashActive]);

  useEffect(() => {
    crashMultiplierRef.current = crashMultiplier;
  }, [crashMultiplier]);

  useEffect(() => {
    crashStatusMessageRef.current = crashStatusMessage;
  }, [crashStatusMessage]);

  const lastFlightStateRef = useRef<{
    planeX: number;
    planeY: number;
    controlX: number;
    controlY: number;
    angle: number;
    multiplier: number;
  } | null>(null);
  const flewAwayTicksRef = useRef<number>(0);

  // Expose local state to track moving elements in the canvas animation loop
  const animationFrameRef = useRef<number | null>(null);
  const gridOffsetRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<{ x: number; y: number; size: number; alpha: number; speedY: number }[]>([]);

  // Update canvas size reactively based on container size (Dynamic Responsive Design)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Safeguard sizes
      setDimensions({
        width: Math.max(width, 320),
        height: Math.max(height, 100)
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Main high-performance paint loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame: number;
    let planeX = 0;
    let planeY = 0;
    let stormTicks = 0;
    let lightningAlpha = 0;
    let raindrops: { x: number; y: number; speed: number; length: number; alpha: number }[] = [];

    const render = () => {
      const w = dimensions.width;
      const h = dimensions.height;
      
      canvas.width = w;
      canvas.height = h;

      // Update grid offsets only if flight is occurring
      const active = crashActiveRef.current;
      const multiplier = crashMultiplierRef.current;
      const isFlewAway = crashStatusMessageRef.current && crashStatusMessageRef.current.includes("FLEW AWAY");

      const currentMult = active ? multiplier : (lastFlightStateRef.current ? lastFlightStateRef.current.multiplier : multiplier);
      const isStormy = currentMult >= 50 && (active || isFlewAway);

      if (isStormy) {
        stormTicks++;
        if (stormTicks === 1 || (stormTicks > 35 && Math.random() < 0.02)) {
          lightningAlpha = 1.0;
        }

        // Draw stormy cloud background
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#0f172a'); // Deep stormy slate horizon top
        skyGrad.addColorStop(0.4, '#1e293b'); // Stormy slate grey clouds
        skyGrad.addColorStop(0.8, '#334155'); // Moody cloud grey
        skyGrad.addColorStop(1, '#0f172a'); // Bottom cockpit slate
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Draw soft stormy clouds
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.beginPath();
        ctx.arc(w * 0.25, h * 0.2, 90, 0, Math.PI * 2);
        ctx.arc(w * 0.6, h * 0.15, 120, 0, Math.PI * 2);
        ctx.arc(w * 0.85, h * 0.3, 100, 0, Math.PI * 2);
        ctx.fill();
      } else {
        stormTicks = 0;
        lightningAlpha = 0;
        raindrops = [];

        // 1. Draw solid dark cockpit background
        ctx.fillStyle = '#100c14'; // Dark space theme
        ctx.fillRect(0, 0, w, h);

        // 2. Draw deep radial pinkish glow in the center-right to match images
        const radialGlow = ctx.createRadialGradient(w * 0.7, h * 0.3, 20, w * 0.7, h * 0.3, w * 0.8);
        radialGlow.addColorStop(0, 'rgba(120, 10, 35, 0.3)'); 
        radialGlow.addColorStop(0.5, 'rgba(30, 8, 25, 0.1)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, w, h);
      }

      // 3. Draw moving background grid lines for velocity feel
      ctx.strokeStyle = isStormy ? 'rgba(148, 163, 184, 0.22)' : '#231433'; // Soft grid lines
      ctx.lineWidth = 1;
      
      if (active) {
        gridOffsetRef.current.x = (gridOffsetRef.current.x - 1.8) % 40;
        gridOffsetRef.current.y = (gridOffsetRef.current.y + 1.2) % 40;
      }

      // Draw vertical grid lines
      for (let x = gridOffsetRef.current.x; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw horizontal grid lines
      for (let y = gridOffsetRef.current.y; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 4. Calculate curve track
      const startX = 40;
      const startY = h - 40;
      let drawPlane = false;
      let angle = 0;

      if (active) {
        flewAwayTicksRef.current = 0; // reset
        const t = 1.0 - 1.0 / Math.pow(multiplier, 0.45);

        // Base coordinate factors starting exactly at (startX, startY)
        const progressX = (startX / w) + t * (0.82 - (startX / w));
        const progressY = (40 / h) + t * (0.78 - (40 / h));

        planeX = w * progressX;
        planeY = h - (h * progressY);

        // Limit plane boundaries with a clean safety margin to prevent leaving viewport bounds
        planeX = Math.max(startX + 10, Math.min(w - 60, planeX));
        planeY = Math.max(40, Math.min(startY, planeY));

        const controlX = startX + (planeX - startX) * 0.65;
        const controlY = startY;

        // Save last state for flew-away freeze frame
        lastFlightStateRef.current = {
          planeX,
          planeY,
          controlX,
          controlY,
          angle: Math.atan2(planeY - startY, planeX - controlX),
          multiplier
        };

        // Draw the Red Sheet underneath the curve block first
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, h - 10);
        ctx.lineTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
        ctx.lineTo(planeX, h - 10);
        ctx.closePath();

        // Create elegant red-theme gradient for the sheet
        const sheetGrad = ctx.createLinearGradient(0, planeY, 0, h - 10);
        sheetGrad.addColorStop(0, 'rgba(163, 11, 28, 0.45)'); 
        sheetGrad.addColorStop(1, 'rgba(163, 11, 28, 0.05)'); 
        ctx.fillStyle = sheetGrad;
        ctx.fill();
        ctx.restore();

        // Draw the main glowing red curve trend line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
        ctx.strokeStyle = '#e21515'; // Hot solid red line
        ctx.lineWidth = 4.5;
        
        ctx.shadowColor = 'rgba(226, 21, 21, 0.9)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        angle = Math.atan2(planeY - startY, planeX - controlX);
        drawPlane = true;

      } else if (isFlewAway && lastFlightStateRef.current) {
        // Increment flew away animation ticks
        flewAwayTicksRef.current += 1;
        const tAway = flewAwayTicksRef.current;

        const state = lastFlightStateRef.current;
        const controlX = state.controlX;
        const controlY = state.controlY;
        const planeXFrozen = state.planeX;
        const planeYFrozen = state.planeY;

        // Draw the frozen Red Sheet
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, h - 10);
        ctx.lineTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, planeXFrozen, planeYFrozen);
        ctx.lineTo(planeXFrozen, h - 10);
        ctx.closePath();

        const sheetGrad = ctx.createLinearGradient(0, planeYFrozen, 0, h - 10);
        sheetGrad.addColorStop(0, 'rgba(163, 11, 28, 0.45)');
        sheetGrad.addColorStop(1, 'rgba(163, 11, 28, 0.05)');
        ctx.fillStyle = sheetGrad;
        ctx.fill();
        ctx.restore();

        // Draw the frozen main glowing red curve trend line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, planeXFrozen, planeYFrozen);
        ctx.strokeStyle = '#e21515';
        ctx.lineWidth = 4.5;
        ctx.shadowColor = 'rgba(226, 21, 21, 0.9)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Calculate accelerated off-screen escape coordinate
        const speedX = 4 + tAway * 0.45;
        const speedY = -2 - tAway * 0.35;
        
        planeX = planeXFrozen + speedX * tAway;
        planeY = planeYFrozen + speedY * tAway;

        // Tilt steeper upwards as it escapes
        angle = state.angle - Math.min(0.35, tAway * 0.012);
        drawPlane = true;

      } else {
        // Reset state & empty particles between rounds
        lastFlightStateRef.current = null;
        flewAwayTicksRef.current = 0;
        particlesRef.current = [];
      }

      if (drawPlane) {
        // 5. Spawn and render red exhaust vapor sparks trailing behind propeller
        if (Math.random() > 0.40) {
          particlesRef.current.push({
            x: planeX - 15,
            y: planeY + 8 + (Math.random() * 8 - 4),
            size: Math.random() * 3.5 + 1.5,
            alpha: 1.0,
            speedY: Math.random() * 0.5 - 0.25
          });
        }

        // Render trailing particle list
        particlesRef.current.forEach((p, idx) => {
          p.x -= 2.2; // flows sideways left
          p.y += p.speedY;
          p.alpha -= 0.024; // fades out organically
          
          if (p.alpha > 0) {
            ctx.fillStyle = `rgba(226, 21, 21, ${p.alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        // Clean decayed particles
        particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0 && p.x > 0);

        const planeCutoutColor = isStormy ? '#1e293b' : '#100c14';

        // 6. Draw glowing solid red airplane icon or modern silhouette
        ctx.save();
        ctx.translate(planeX, planeY);
        ctx.rotate(angle);

        // Core airplane drawing (beautiful red icon geometry representation matching the reference precisely)
        ctx.shadowColor = 'rgba(255, 30, 30, 0.9)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff1e1e'; // Solid vibrant red
        ctx.strokeStyle = '#ff1e1e';
        ctx.lineWidth = 1.5;

        // Draw the main fuselage body (solid red with elegant classic outline)
        ctx.beginPath();
        // Starts behind the spinner/nose (right side)
        ctx.moveTo(22, -1);
        // Cockpit hood & canopy
        ctx.quadraticCurveTo(10, -7, 2, -7);
        // Canopy glass dome
        ctx.bezierCurveTo(-2, -15, -12, -15, -18, -6);
        // Taper back to the tail
        ctx.lineTo(-32, -4);
        // Tail fin (vertical stabilizer)
        ctx.lineTo(-38, -16);
        ctx.lineTo(-44, -14);
        ctx.quadraticCurveTo(-40, -4, -42, 0); // bottom tail tip
        // Underbody tailwheel structure
        ctx.lineTo(-35, 3);
        // Bottom fuselage tapering to nose
        ctx.lineTo(-20, 4);
        ctx.quadraticCurveTo(0, 7, 22, -1);
        ctx.closePath();
        ctx.fill();

        // Structural detail lines inside to form the negative cuts / accents (matching reference)
        ctx.strokeStyle = planeCutoutColor; // Matching cockpit background for sharp cutouts
        ctx.lineWidth = 1.8;

        // Cockpit glass pane detail line cutouts
        ctx.beginPath();
        ctx.moveTo(-6, -12);
        ctx.lineTo(-8, -6);
        ctx.moveTo(-12, -11);
        ctx.lineTo(-14, -6);
        ctx.stroke();

        // Diagonal fuselage rib markings ("X" mark)
        ctx.beginPath();
        ctx.moveTo(-16, -1);
        ctx.lineTo(-26, 2);
        ctx.moveTo(-26, -1);
        ctx.lineTo(-16, 2);
        ctx.stroke();

        // Draw the classic propeller biplane wings
        ctx.fillStyle = '#ff1e1e';
        ctx.shadowBlur = 4;

        // 1. Lower Wing (pointing down-left)
        ctx.beginPath();
        ctx.moveTo(10, 2);
        ctx.bezierCurveTo(2, 12, -14, 25, -20, 24);
        ctx.lineTo(-25, 18);
        ctx.bezierCurveTo(-15, 12, 2, 4, 10, 2);
        ctx.closePath();
        ctx.fill();

        // Lower wing structural ribs
        ctx.strokeStyle = planeCutoutColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let offset = -5; offset <= 10; offset += 5) {
          ctx.moveTo(-8 - offset, 11 + offset * 0.6);
          ctx.lineTo(-12 - offset, 16 + offset * 0.6);
        }
        ctx.stroke();

        // 2. Upper Wing (pointing up-left)
        ctx.fillStyle = '#ff1e1e';
        ctx.beginPath();
        ctx.moveTo(12, -8);
        ctx.bezierCurveTo(4, -18, -12, -28, -18, -26);
        ctx.lineTo(-22, -20);
        ctx.bezierCurveTo(-14, -16, 4, -8, 12, -8);
        ctx.closePath();
        ctx.fill();

        // Upper wing structural ribs
        ctx.strokeStyle = planeCutoutColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let offset = -5; offset <= 10; offset += 5) {
          ctx.moveTo(-7 - offset, -15 - offset * 0.6);
          ctx.lineTo(-11 - offset, -20 - offset * 0.6);
        }
        ctx.stroke();

        // Wing attachment struts
        ctx.strokeStyle = '#ff1e1e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(5, -6);
        ctx.lineTo(2, -14);
        ctx.moveTo(-8, -5);
        ctx.lineTo(-10, -18);
        ctx.stroke();

        // 3. Horizontal Elevator Stabilizer
        ctx.fillStyle = '#ff1e1e';
        ctx.beginPath();
        ctx.moveTo(-30, -2);
        ctx.quadraticCurveTo(-38, 2, -42, 6);
        ctx.lineTo(-44, 2);
        ctx.quadraticCurveTo(-38, -2, -30, -2);
        ctx.closePath();
        ctx.fill();

        // Propeller Head hub
        ctx.fillStyle = '#ff1e1e';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(22, -1, 4.5, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // Propeller Blades spinning fast
        ctx.save();
        ctx.translate(22, -1);
        ctx.rotate(Date.now() / 60);
        ctx.fillStyle = '#ff1e1e';
        ctx.strokeStyle = '#ff1e1e';
        ctx.lineWidth = 1;
        
        // Prop blade 1
        ctx.beginPath();
        ctx.moveTo(-1.5, 0);
        ctx.quadraticCurveTo(-3, -15, -1, -26);
        ctx.quadraticCurveTo(2.5, -26, 1.5, 0);
        ctx.closePath();
        ctx.fill();

        // Prop blade 1 white highlight tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-0.5, -24, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Prop blade 2
        ctx.fillStyle = '#ff1e1e';
        ctx.beginPath();
        ctx.moveTo(-1.5, 0);
        ctx.quadraticCurveTo(-3, 15, -1, 26);
        ctx.quadraticCurveTo(2.5, 26, 1.5, 0);
        ctx.closePath();
        ctx.fill();

        // Prop blade 2 white highlight tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-0.5, 24, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();
        ctx.shadowBlur = 0; // reset
      } else {
        // Clear old exhaust vapor particles during runway downtime
        particlesRef.current = [];
      }

      if (isStormy) {
        // Draw lightning flash & bolts
        if (lightningAlpha > 0) {
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningAlpha * 0.35})`;
          ctx.fillRect(0, 0, w, h);

          if (lightningAlpha > 0.2) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${lightningAlpha})`;
            ctx.lineWidth = 3.5;
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            const boltX = (w * 0.35 + (stormTicks * 107) % (w * 0.45));
            ctx.moveTo(boltX, 0);
            ctx.lineTo(boltX - 15 + (Math.sin(stormTicks) * 30), h * 0.35);
            ctx.lineTo(boltX + 15 + (Math.cos(stormTicks) * 40), h * 0.65);
            ctx.lineTo(boltX - 25, h);
            ctx.stroke();
          }
          ctx.restore();

          lightningAlpha = Math.max(0, lightningAlpha - 0.06);
        }

        // Starts to rain after lightning (stormTicks > 18)
        if (stormTicks > 18) {
          for (let i = 0; i < 12; i++) {
            raindrops.push({
              x: Math.random() * (w + 100),
              y: -20 + Math.random() * 20,
              speed: 18 + Math.random() * 12,
              length: 15 + Math.random() * 22,
              alpha: 0.35 + Math.random() * 0.45
            });
          }

          ctx.save();
          ctx.lineWidth = 1.5;
          raindrops.forEach((drop) => {
            drop.x -= 4.5;
            drop.y += drop.speed;
            ctx.strokeStyle = `rgba(186, 230, 253, ${drop.alpha})`;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 3.5, drop.y + drop.length);
            ctx.stroke();
          });
          ctx.restore();

          raindrops = raindrops.filter((d) => d.y < h + 40 && d.x > -50);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [dimensions]);

  return (
    <div 
      ref={containerRef}
      className="md:rounded-2xl rounded-xl relative shadow-inner select-none overflow-hidden h-full flex-1 w-full border border-red-500/10 flex flex-col justify-center items-center"
    >
      {/* 1. Underlying Render Canvas (Smooth 60FPS drawing grids and red flights) */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none z-0"
      />

      {/* 2. Top-Left Overlay Pill Indicator - Dynamic Play Mode badge */}
      <div className="absolute top-3 left-4 z-10 select-none flex items-center gap-1">
        {authSessionMode === 'real' ? (
          <div className="bg-[#1b1c21]/90 border border-emerald-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">REAL MODE</span>
          </div>
        ) : (
          <div className="bg-[#1b1c21]/90 border border-amber-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">FUN MODE</span>
          </div>
        )}
      </div>

      {/* 3. CENTER OVERLAY CONTENT: Dynamic multipliers counting or Pre-flight indicators */}
      <div className="absolute inset-0 flex flex-col justify-center items-center z-10 select-none pointer-events-none text-center px-4">
        
        {/* Render active multipliers text as plane is soared! */}
        {crashActive ? (
          <div className="animate-scaleUp">
            {/* Massive Glowing Counter - Matches photographs */}
            <div className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-sans font-black text-white px-2 sm:px-6 drop-shadow-[0_4px_15px_rgba(255,255,255,0.2)] select-none">
              {crashMultiplier.toFixed(2)}x
            </div>
            <div className="text-[9px] sm:text-[10px] text-[#ff3333] font-mono font-semibold tracking-widest uppercase mt-0.5 sm:mt-1 animate-pulse">
              Red Plane ascending!
            </div>
          </div>
        ) : (
          <div className="px-4 py-2 sm:px-6 sm:py-4 rounded-xl bg-black/50 backdrop-blur-xs select-none max-w-[280px] xs:max-w-xs animate-fadeIn pointer-events-auto">
            
            {/* Pre-flight Countdown overlay indicator */}
            {countdownValue !== null ? (
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                {/* Propeller mini spinning graphic inside preflight lobby */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-red-500/30 flex items-center justify-center bg-red-950/20 text-red-500 text-sm sm:text-lg animate-spin">
                  ✈️
                </div>
                
                <h5 className="text-[9px] sm:text-xs uppercase font-extrabold tracking-widest text-[#9b9da4]">
                  WAIT FOR UPCOMING ROUND
                </h5>
                
                {/* Visual bar counting down */}
                <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-mono font-black text-white leading-none tracking-tight">
                  NEXT ROUND IN <span className="text-[#00e600]">{countdownValue.toFixed(1)}s</span>
                </div>

                <div className="w-28 sm:w-36 h-1 bg-red-900/30 rounded-full overflow-hidden mt-0.5 px-0.5">
                  <div 
                    className="h-full bg-[#00e600] rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${(countdownValue / 5) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-center">
                
                {/* Flew Away / Burst Multiplier Display */}
                {crashStatusMessage.includes('FLEW AWAY') ? (
                  <div>
                    <h3 className="text-white text-[10px] sm:text-xs uppercase font-black tracking-[0.2em] text-[#ff3333] select-none block leading-none mb-1">
                      FLEW AWAY!
                    </h3>
                    <div className="text-3xl xs:text-4xl sm:text-5xl font-sans font-black text-[#ff3333] drop-shadow-[0_2px_8px_rgba(255,51,51,0.4)] select-none">
                      {crashMultiplier.toFixed(2)}x
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] sm:text-xs text-[#a0a2aa] uppercase font-bold tracking-widest mb-0.5 sm:mb-1 select-none">
                      {crashStatusMessage}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-red-500/80 animate-pulse">
                      System loaded & ready KSh
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
