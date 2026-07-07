/**
 * Minimap component
 */
import React, { useRef, useEffect } from 'react';
import useGameStore from '@stores/useGameStore';

export default function Minimap() {
  const canvasRef = useRef(null);
  const landSize = useGameStore(s => s.landSize);
  
  useEffect(() => {
    // Simple minimap render - can be expanded
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#05040e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw land area
    const scale = canvas.width / 100;
    const offset = (100 - landSize) / 2;
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(offset * scale, offset * scale, landSize * scale, landSize * scale);
  }, [landSize]);
  
  return (
    <div id="mini-map">
      <canvas ref={canvasRef} width={200} height={176} />
    </div>
  );
}
