import React from 'react';

interface ScannerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onScan?: (data: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-emerald-400">📸 Universal Camera / OCR Scanner</h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="border-2 border-dashed border-emerald-500/50 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-800/50 my-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 animate-pulse">
            📷
          </div>
          <p className="text-sm text-slate-300 text-center">
            Position Barcode / Document Invoice inside the frame to scan automatically.
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
