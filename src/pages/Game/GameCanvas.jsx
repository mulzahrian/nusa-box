/**
 * GameCanvas - manages the Three.js canvas and game loop
 */
import React, { useEffect, useRef } from 'react';
import engine from '@core/Engine';
import terrain from '@core/Terrain';
import dayNight from '@systems/DayNightSystem';
import vehicleSystem from '@systems/VehicleSystem';
import shipSystem from '@systems/ShipSystem';
import easterEggSystem from '@systems/EasterEggSystem';
import useGameStore from '@stores/useGameStore';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const initialized = useRef(false);
  
  useEffect(() => {
    if (initialized.current || !canvasRef.current) return;
    initialized.current = true;
    
    // Initialize engine
    engine.init(canvasRef.current);
    
    // Generate terrain
    const { mapId } = useGameStore.getState();
    terrain.applyBiome(mapId);
    terrain.generateMesh(engine.scene);
    
    // Setup game loop
    engine.onUpdate((dt) => {
      const state = useGameStore.getState();
      if (state.paused) return;
      
      const speed = state.speed;
      dayNight.update(dt * speed, 1);
      vehicleSystem.update(dt * speed);
      shipSystem.update(dt * speed);
      easterEggSystem.update(dt, dayNight.hour, {
        desertCenter: { x: 30, z: 30 },
        forestCenter: { x: -20, z: -20 },
      });
    });
    
    engine.startLoop();
    
    // Camera controls
    const handleWheel = (e) => {
      engine.camDist = Math.max(10, Math.min(150, engine.camDist + e.deltaY * 0.05));
      engine.updateCamera();
    };
    
    let dragging = false;
    let lastX = 0, lastY = 0;
    
    const handleMouseDown = (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    
    const handleMouseMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      
      engine.camAngle -= dx * 0.005;
      engine.camPitch = Math.max(0.1, Math.min(Math.PI / 2.5, engine.camPitch + dy * 0.005));
      engine.updateCamera();
    };
    
    const handleMouseUp = () => { dragging = false; };
    
    const handleKeyDown = (e) => {
      const moveSpeed = 2;
      const angle = engine.camAngle;
      switch (e.key.toLowerCase()) {
        case 'w': engine.camTarget.z -= Math.cos(angle) * moveSpeed; engine.camTarget.x -= Math.sin(angle) * moveSpeed; break;
        case 's': engine.camTarget.z += Math.cos(angle) * moveSpeed; engine.camTarget.x += Math.sin(angle) * moveSpeed; break;
        case 'a': engine.camTarget.x -= Math.cos(angle) * moveSpeed; engine.camTarget.z += Math.sin(angle) * moveSpeed; break;
        case 'd': engine.camTarget.x += Math.cos(angle) * moveSpeed; engine.camTarget.z -= Math.sin(angle) * moveSpeed; break;
        case 'q': engine.camAngle -= 0.05; break;
        case 'e': engine.camAngle += 0.05; break;
      }
      engine.updateCamera();
    };
    
    const canvas = canvasRef.current;
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      engine.stopLoop();
    };
  }, []);
  
  return <canvas ref={canvasRef} id="game-canvas" />;
}
