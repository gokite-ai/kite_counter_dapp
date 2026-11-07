import React from 'react';

export interface AuditRecord {
  id: string;
  action: string;
  previousValue: number;
  newValue: number;
  timestamp: string;
}

export const CounterAuditTrailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  records?: AuditRecord[];
}> = ({ isOpen, onClose, records = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-100">Counter Interaction History</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            &times;
          </button>
        </div>
        <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-neutral-800">
          {records.length === 0 ? (
            <p className="py-4 text-center text-xs text-neutral-500">No interaction logs captured yet.</p>
          ) : (
            records.map((r) => (
              <div key={r.id} className="py-2 flex justify-between text-xs text-neutral-300">
                <span className="font-mono">{r.action}</span>
                <span className="text-neutral-500">{r.previousValue} &rarr; {r.newValue}</span>
                <span className="text-neutral-400">{r.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterAuditTrailModal;
