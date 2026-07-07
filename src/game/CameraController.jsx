import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

const MIN_ZOOM = 14;
const MAX_ZOOM = 44;
const CAMERA_OFFSET = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(72);
const DRAG_RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const DRAG_FORWARD = new THREE.Vector3(1, 0, 1).normalize();

export default function CameraController() {
  const { camera, gl } = useThree();
  const initialCamera = useGameStore((state) => state.camera);
  const setCameraState = useGameStore((state) => state.setCamera);
  const keyState = useRef({});
  const isDragging = useRef(false);
  const dragDelta = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(initialCamera.x, 0, initialCamera.z));
  const current = useRef(new THREE.Vector3(initialCamera.x, 0, initialCamera.z));
  const targetZoom = useRef(initialCamera.zoom);
  const currentZoom = useRef(initialCamera.zoom);

  useEffect(() => {
    const onKeyDown = (event) => {
      keyState.current[event.code] = true;
    };
    const onKeyUp = (event) => {
      keyState.current[event.code] = false;
    };
    const onMouseDown = (event) => {
      if (event.button !== 1) {
        return;
      }
      event.preventDefault();
      isDragging.current = true;
      lastPointer.current = { x: event.clientX, y: event.clientY };
    };
    const onMouseMove = (event) => {
      if (!isDragging.current) {
        return;
      }
      dragDelta.current.x += event.clientX - lastPointer.current.x;
      dragDelta.current.y += event.clientY - lastPointer.current.y;
      lastPointer.current = { x: event.clientX, y: event.clientY };
    };
    const stopDrag = () => {
      isDragging.current = false;
    };
    const onWheel = (event) => {
      event.preventDefault();
      targetZoom.current = THREE.MathUtils.clamp(targetZoom.current - event.deltaY * 0.015, MIN_ZOOM, MAX_ZOOM);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    gl.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDrag);
    gl.domElement.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      gl.domElement.removeEventListener('wheel', onWheel);
    };
  }, [gl.domElement]);

  useFrame((_, delta) => {
    const moveSpeed = delta * currentZoom.current * 0.9;
    if (keyState.current.KeyW) target.current.z -= moveSpeed;
    if (keyState.current.KeyS) target.current.z += moveSpeed;
    if (keyState.current.KeyA) target.current.x -= moveSpeed;
    if (keyState.current.KeyD) target.current.x += moveSpeed;

    if (dragDelta.current.x || dragDelta.current.y) {
      const dragScale = 0.04 * (currentZoom.current / 24);
      target.current.addScaledVector(DRAG_RIGHT, -dragDelta.current.x * dragScale);
      target.current.addScaledVector(DRAG_FORWARD, dragDelta.current.y * dragScale);
      dragDelta.current = { x: 0, y: 0 };
    }

    current.current.lerp(target.current, 1 - Math.exp(-delta * 10));
    currentZoom.current = THREE.MathUtils.lerp(currentZoom.current, targetZoom.current, 1 - Math.exp(-delta * 10));
    camera.position.copy(current.current).add(CAMERA_OFFSET);
    camera.zoom = currentZoom.current;
    camera.lookAt(current.current);
    camera.updateProjectionMatrix();
    setCameraState({ x: current.current.x, z: current.current.z, zoom: currentZoom.current });
  });

  return null;
}
