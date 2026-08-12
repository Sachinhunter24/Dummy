import React from 'react';

interface AIDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AIDrawer: React.FC<AIDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 text-white shadow-xl z-50 p-4 border-l border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">🤖 AI Enterprise Assistant</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>
      <div className="p-3 bg-slate-800 rounded-lg text-sm text-slate-300">
        Universal ERP AI Helper is Ready! Ask anything about inventory, clients, or billing.
      </div>
    </div>
  );
};

export default AIDrawer;
