import React, { useState, useEffect } from 'react';

export default function RenderIndicator({ leftOffset }: { leftOffset: number }) {
  return (
    <div className="render-indicator">
      <div className="bar" style={{ marginLeft: `${leftOffset}%` }}></div>
    </div>
  )
}