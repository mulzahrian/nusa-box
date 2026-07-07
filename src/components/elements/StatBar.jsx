/**
 * StatBar - displays a stat with icon, label, and value
 */
import React from 'react';
import PixelIcon from './PixelIcon';

export default function StatBar({ icon, label, value, status = '' }) {
  return (
    <div className={`stat ${status}`}>
      {icon && <span className="icon"><PixelIcon name={icon} size={16} /></span>}
      <div>
        {label && <span className="label">{label}</span>}
        <span className="value">{value}</span>
      </div>
    </div>
  );
}
