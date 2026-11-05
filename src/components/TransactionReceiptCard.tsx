import React from 'react';

export interface ReceiptData {
  txHash: string;
  blockNumber: number;
  newCounterValue: number;
}

export const TransactionReceiptCard: React.FC<{ receipt: ReceiptData; onClose: () => void }> = ({ receipt, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-100">
        <h4 className="font-bold text-sm text-emerald-400">Transaction Confirmed!</h4>
        <div className="mt-3 space-y-1.5 text-xs text-neutral-300 font-mono">
          <p>Block: #{receipt.blockNumber}</p>
          <p>Counter: {receipt.newCounterValue}</p>
          <p className="truncate text-neutral-400">Tx: {receipt.txHash}</p>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded bg-neutral-800 py-1.5 text-xs hover:bg-neutral-700">
          Close
        </button>
      </div>
    </div>
  );
};

export default TransactionReceiptCard;
