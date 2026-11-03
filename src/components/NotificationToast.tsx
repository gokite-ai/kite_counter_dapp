import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  txHash?: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start justify-between rounded-lg border border-neutral-700 bg-neutral-900/95 p-4 shadow-xl backdrop-blur-md text-xs text-neutral-100"
        >
          <div>
            <p className="font-semibold">{toast.title}</p>
            {toast.txHash && (
              <a
                href={`https://testnet.kitescan.ai/tx/${toast.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block font-mono text-cyan-400 hover:underline"
              >
                View on KiteScan &rarr;
              </a>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-neutral-500 hover:text-neutral-300 ml-3"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
