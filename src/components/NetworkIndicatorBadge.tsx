import React from 'react';

interface NetworkIndicatorBadgeProps {
  chainId?: number;
  chainName?: string;
  latencyMs?: number;
}

export const NetworkIndicatorBadge: React.FC<NetworkIndicatorBadgeProps> = ({
  chainId = 2368,
  chainName = 'Kite Testnet',
  latencyMs = 120,
}) => {
  const isHealthy = latencyMs < 300;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1 text-xs">
      <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
      <span className="font-medium text-neutral-200">{chainName}</span>
      <span className="font-mono text-[10px] text-neutral-400">({chainId}) &bull; {latencyMs}ms</span>
    </div>
  );
};

export default NetworkIndicatorBadge;
