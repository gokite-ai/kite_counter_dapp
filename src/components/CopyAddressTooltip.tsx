import React, { useState } from 'react';

export const CopyAddressTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700 transition"
    >
      <span>{copied ? '✓ Copied' : 'Copy'}</span>
    </button>
  );
};

export default CopyAddressTooltip;
