'use client';

import { useRef, useEffect, useCallback } from 'react';

export interface CommentData {
  id: string;
  text: string;
  color: string;
  position: 'flow' | 'top' | 'bottom';
}

export interface CanvasConfig {
  fontSize: number;
  speed: number;
  bgMode: string;
}

interface FlowComment {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  speed: number;
  lane: number;
}

interface FixedComment {
  id: string;
  text: string;
  color: string;
  y: number;
  slot: number;
  expireAt: number;
}

const FONT_FAMILY = '"Hiragino Kaku Gothic Pro", "Yu Gothic", "Noto Sans JP", Arial, sans-serif';

export function useCommentCanvas(config: CanvasConfig) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowRef = useRef<FlowComment[]>([]);
  const topRef = useRef<FixedComment[]>([]);
  const bottomRef = useRef<FixedComment[]>([]);
  const configRef = useRef(config);
  configRef.current = config;

  const addComment = useCallback((data: CommentData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const { fontSize, speed } = configRef.current;

    ctx.save();
    ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
    const textWidth = ctx.measureText(data.text).width;
    ctx.restore();

    if (data.position === 'flow') {
      const laneHeight = fontSize * 1.4;
      const numLanes = Math.max(1, Math.floor(h / laneHeight));

      // Find the lane with most available space
      const laneScores = Array.from({ length: numLanes }, (_, i) => {
        const inLane = flowRef.current.filter((c) => c.lane === i);
        if (inLane.length === 0) return { lane: i, space: Infinity };
        const last = inLane[inLane.length - 1];
        return { lane: i, space: w - (last.x + last.width) };
      });
      laneScores.sort((a, b) => b.space - a.space);
      const bestLane = laneScores[0].lane;

      // Duration: speed 1 → 10s, speed 10 → 3s
      const duration = 10 - (speed - 1) * (7 / 9);
      const pxPerFrame = (w + textWidth) / (60 * duration);

      flowRef.current.push({
        id: data.id,
        text: data.text,
        color: data.color,
        x: w,
        y: bestLane * laneHeight + fontSize,
        width: textWidth,
        speed: pxPerFrame,
        lane: bestLane,
      });
    } else if (data.position === 'top') {
      const slotHeight = fontSize * 1.4;
      const usedSlots = new Set(topRef.current.map((c) => c.slot));
      let slot = 0;
      while (usedSlots.has(slot)) slot++;

      topRef.current.push({
        id: data.id,
        text: data.text,
        color: data.color,
        y: slot * slotHeight + fontSize,
        slot,
        expireAt: Date.now() + 3000,
      });
    } else {
      const slotHeight = fontSize * 1.4;
      const usedSlots = new Set(bottomRef.current.map((c) => c.slot));
      let slot = 0;
      while (usedSlots.has(slot)) slot++;

      bottomRef.current.push({
        id: data.id,
        text: data.text,
        color: data.color,
        y: h - slot * slotHeight - 10,
        slot,
        expireAt: Date.now() + 3000,
      });
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const { fontSize, bgMode } = configRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      if (bgMode !== 'transparent') {
        ctx.fillStyle = bgMode === 'black' ? '#000000' : bgMode;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
      ctx.lineJoin = 'round';
      ctx.textBaseline = 'middle';

      // Flowing comments
      ctx.textAlign = 'left';
      flowRef.current = flowRef.current.filter((c) => {
        c.x -= c.speed;
        if (c.x + c.width < 0) return false;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(c.text, c.x, c.y);
        ctx.fillStyle = c.color;
        ctx.fillText(c.text, c.x, c.y);
        return true;
      });

      // Top fixed
      const now = Date.now();
      ctx.textAlign = 'center';
      topRef.current = topRef.current.filter((c) => {
        if (now >= c.expireAt) return false;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(c.text, w / 2, c.y);
        ctx.fillStyle = c.color;
        ctx.fillText(c.text, w / 2, c.y);
        return true;
      });

      // Bottom fixed
      bottomRef.current = bottomRef.current.filter((c) => {
        if (now >= c.expireAt) return false;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(c.text, w / 2, c.y);
        ctx.fillStyle = c.color;
        ctx.fillText(c.text, w / 2, c.y);
        return true;
      });

      ctx.textAlign = 'left';
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return { canvasRef, addComment };
}
