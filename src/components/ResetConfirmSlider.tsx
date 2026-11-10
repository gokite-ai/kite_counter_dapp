import React, { useState } from 'react';

interface ResetConfirmSliderProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetConfirmSlider: React.FC<ResetConfirmSliderProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    if (val >= 100) {
      try {
        setIsResetting(true);
        await onConfirmReset();
        onClose();
      } finally {
        setIsResetting(false);
        setSliderValue(0);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-red-900/40 bg-neutral-900 p-6 shadow-2xl text-neutral-100">
        <h3 className="text-base font-bold text-red-300">Confirm Counter Reset</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Slide fully to the right to confirm on-chain reset. This action cannot be undone.
        </p>

        <div className="mt-6">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={isResetting}
            className="w-full accent-red-500 cursor-pointer"
          />
          <div className="mt-2 flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>Slide to unlock</span>
            <span>{sliderValue}%</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={isResetting}
            className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmSlider;
