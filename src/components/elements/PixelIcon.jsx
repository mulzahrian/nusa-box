/**
 * PixelIcon - renders a pixel art icon from the icon system
 */
import React from 'react';
import { getIconSrc } from '@data/icons';

export default function PixelIcon({ name, size = 24 }) {
  const src = getIconSrc(name, size);
  if (!src) return <span>❓</span>;
  return <img src={src} width={size} height={size} alt={name} style={{ imageRendering: 'pixelated' }} />;
}
