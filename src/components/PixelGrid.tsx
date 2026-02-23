import React, { useRef, useEffect, useState } from 'react';
import { Block, Selection } from '../types';
import { GRID_SIZE, BLOCK_SIZE, CANVAS_SIZE } from '../constants';

interface PixelGridProps {
  blocks: Block[];
  selection: Selection | null;
  onSelectionChange: (sel: Selection | null) => void;
  onHoverBlock: (block: Block | null) => void;
  currentPage: number;
}

export default function PixelGrid({ blocks, selection, onSelectionChange, onHoverBlock, currentPage }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const [renderTrigger, setRenderTrigger] = useState(0);
  const animationFrameRef = useRef<number>(null);

  const isSelectionValid = (sel: Selection) => {
    const pageBlocks = blocks.filter(b => b.page === currentPage);
    return !pageBlocks.some(block => {
      // Check if selection rectangle intersects with block rectangle
      return !(
        block.x >= sel.x + sel.w ||
        block.x + block.w <= sel.x ||
        block.y >= sel.y + sel.h ||
        block.y + block.h <= sel.y
      );
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const pageBlocks = blocks.filter(b => b.page === currentPage);

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Grid background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Grid lines (only draw if zoomed in or small enough, but here we draw all)
      // For 316x316, drawing all lines might be slow, but let's try
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      // Optimization: only draw every 10th line if needed, but 316 is okay
      for (let i = 0; i <= GRID_SIZE; i += 1) {
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, CANVAS_SIZE);
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * BLOCK_SIZE);
      }
      ctx.stroke();

      // Blocks
      pageBlocks.forEach(block => {
        const x = block.x * BLOCK_SIZE;
        const y = block.y * BLOCK_SIZE;
        const w = block.w * BLOCK_SIZE;
        const h = block.h * BLOCK_SIZE;

        if (block.animated) {
          const pulse = Math.sin(frame * 0.1) * 2;
          ctx.save();
          ctx.shadowBlur = 10 + pulse * 2;
          ctx.shadowColor = 'rgba(249, 115, 22, 0.5)';
        }

        if (block.imageUrl) {
          let img = imageCache.current[block.imageUrl];
          if (!img) {
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = block.imageUrl;
            img.onload = () => setRenderTrigger(n => n + 1);
            imageCache.current[block.imageUrl] = img;
          }
          
          if (img.complete && img.naturalHeight !== 0) {
            ctx.drawImage(img, x, y, w, h);
          } else {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(x, y, w, h);
          }
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x, y, w, h);
        }

        if (block.animated) {
          ctx.restore();
          // Add a small animated border
          ctx.strokeStyle = `rgba(249, 115, 22, ${0.5 + Math.sin(frame * 0.1) * 0.3})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, w, h);
        }
      });

      // Selection
      if (selection) {
        const valid = isSelectionValid(selection);
        ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(selection.x * BLOCK_SIZE, selection.y * BLOCK_SIZE, selection.w * BLOCK_SIZE, selection.h * BLOCK_SIZE);
        ctx.strokeStyle = valid ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(selection.x * BLOCK_SIZE, selection.y * BLOCK_SIZE, selection.w * BLOCK_SIZE, selection.h * BLOCK_SIZE);
      } else if (hoverPos && !isDragging) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(hoverPos.x * BLOCK_SIZE, hoverPos.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [blocks, selection, hoverPos, isDragging, renderTrigger, currentPage]);

  const getBlockCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.floor(((clientX - rect.left) * scaleX) / BLOCK_SIZE);
    const y = Math.floor(((clientY - rect.top) * scaleY) / BLOCK_SIZE);
    return { x: Math.max(0, Math.min(x, GRID_SIZE - 1)), y: Math.max(0, Math.min(y, GRID_SIZE - 1)) };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getBlockCoords(e);
    
    // Check if clicked on an existing block
    const pageBlocks = blocks.filter(b => b.page === currentPage);
    const clickedBlock = pageBlocks.find(b => coords.x >= b.x && coords.x < b.x + b.w && coords.y >= b.y && coords.y < b.y + b.h);
    if (clickedBlock) {
      window.open(clickedBlock.link, '_blank');
      return;
    }

    setIsDragging(true);
    setStartPos(coords);
    onSelectionChange({ x: coords.x, y: coords.y, w: 1, h: 1 });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getBlockCoords(e);
    setHoverPos(coords);

    // Check hover block
    const pageBlocks = blocks.filter(b => b.page === currentPage);
    const hoveredBlock = pageBlocks.find(b => coords.x >= b.x && coords.x < b.x + b.w && coords.y >= b.y && coords.y < b.y + b.h);
    onHoverBlock(hoveredBlock || null);

    if (isDragging && startPos) {
      const minX = Math.min(startPos.x, coords.x);
      const minY = Math.min(startPos.y, coords.y);
      const maxX = Math.max(startPos.x, coords.x);
      const maxY = Math.max(startPos.y, coords.y);
      onSelectionChange({
        x: minX,
        y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative overflow-auto border border-gray-200 rounded-lg shadow-inner bg-gray-50 max-h-[calc(100vh-12rem)] w-full">
      <div style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="cursor-crosshair touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => { setIsDragging(false); setHoverPos(null); onHoverBlock(null); }}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onTouchCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}
