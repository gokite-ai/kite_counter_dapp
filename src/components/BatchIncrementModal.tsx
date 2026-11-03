import React, { useState } from 'react';

interface BatchIncrementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBatch: (count: number) => Promise<void>;
}

export const BatchIncrementModal: React.FC<BatchIncrementModalProps> = ({
  isOpen,
  onClose,
  onConfirmBatch,
}) => {
  const [count, setCount] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await onConfirmBatch(count);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-neutral-100">
        <h3 className="text-base font-bold">Batch Counter Increment</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Increment the counter multiple times in rapid sequence while optimizing gas usage.
        </p>

        <div className="mt-4 flex gap-2">
          {[3, 5, 10, 20].map((num) => (
            <button
              key={num}
              onClick={() => setCount(num)}
              className={`flex-1 rounded-lg py-2 font-mono text-sm font-semibold transition border ${
                count === num
                  ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300'
                  : 'border-neutral-800 bg-neutral-800/40 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              +{num}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : `Execute +${count} Batch`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchIncrementModal;
