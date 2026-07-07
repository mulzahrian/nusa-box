/**
 * PixelButton - Reusable pixel-art styled button element
 */
import React from 'react';
import { getIconSrc } from '@data/icons';

export default function PixelButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'default', // 'default' | 'primary' | 'danger' | 'success'
  size = 'md',
  className = '',
}) {
  const iconSrc = icon ? getIconSrc(icon, 24) : null;
  
  return (
    <button
      className={`pixel-btn pixel-btn--${variant} pixel-btn--${size} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {iconSrc && (
        <span className="btn-icon">
          <img src={iconSrc} width={size === 'sm' ? 16 : 24} height={size === 'sm' ? 16 : 24} alt="" />
        </span>
      )}
      {label && <span className="btn-label">{label}</span>}
    </button>
  );
}
