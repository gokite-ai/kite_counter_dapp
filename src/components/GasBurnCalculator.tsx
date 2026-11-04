import React from 'react';

interface GasBurnCalculatorProps {
  txCount: number;
  totalGasUsed: number;
  gasPriceGwei?: number;
}

export const GasBurnCalculator: React.FC<GasBurnCalculatorProps> = ({
  txCount,
  totalGasUsed,
  gasPriceGwei = 0.05,
}) => {
  const totalEthBurned = (totalGasUsed * gasPriceGwei) / 1e9;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-xs text-neutral-300">
      <div className="flex justify-between items-center pb-1">
        <span className="text-neutral-400">Session Transactions:</span>
        <span className="font-mono font-bold text-neutral-100">{txCount}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-neutral-400">Est. Gas Burned:</span>
        <span className="font-mono text-cyan-400">{totalEthBurned.toFixed(6)} KITE</span>
      </div>
    </div>
  );
};

export default GasBurnCalculator;
