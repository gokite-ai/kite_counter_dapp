import React, { useState, useEffect } from 'react';

export const AutoRefreshTimer: React.FC<{ onRefresh: () => void; intervalMs?: number }> = ({ onRefresh, intervalMs = 10000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const stepMs = 200;
    const decrement = (stepMs / intervalMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          onRefresh();
          return 100;
        }
        return prev - decrement;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [onRefresh, intervalMs]);

  return (
    <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden">
      <div className="bg-cyan-500 h-1 transition-all duration-200" style={{ width: `${progress}%` }} />
    </div>
  );
};

export default AutoRefreshTimer;
