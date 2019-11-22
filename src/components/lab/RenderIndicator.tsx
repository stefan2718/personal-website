import React from 'react';
import './RenderIndicator.scss';

export default function RenderIndicator({ leftOffset }: { leftOffset: number }) {
  return (
    <div className="render-indicator">
      <div className="bar" style={{ marginLeft: `${leftOffset}%` }}></div>
    </div>
  )
}