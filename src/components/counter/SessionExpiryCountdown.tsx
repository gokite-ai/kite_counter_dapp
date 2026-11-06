import React, { useState, useEffect } from 'react';

export interface SessionExpiryCountdownProps {
  durationSeconds?: number;
  onExpire?: () => void;
  onWarn?: (secondsRemaining: number) => void;
}

export const SessionExpiryCountdown: React.FC<SessionExpiryCountdownProps> = ({
  durationSeconds = 300,
  onExpire,
  onWarn,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire();
          return 0;
        }
        if (prev - 1 === 60 && onWarn) {
          onWarn(60);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [durationSeconds, onExpire, onWarn]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isExpiringSoon = secondsRemaining <= 60;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-xs transition-colors ${
        isExpiringSoon
          ? 'border-rose-800 bg-rose-950/60 text-rose-300'
          : 'border-neutral-800 bg-neutral-900/60 text-neutral-300'
      }`}
    >
      <div className="flex items-center space-x-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isExpiringSoon ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
          }`}
        />
        <span>Session Auth TTL:</span>
      </div>
      <span className="font-mono font-bold tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default SessionExpiryCountdown;
