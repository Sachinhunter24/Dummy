import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { mockProducts } from '../../data/mockData';

export function ScannerModal() {
  const { isScannerOpen, setIsScannerOpen } = useApp();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<{ sku: string; product: (typeof mockProducts)[number] | null } | null>(null);

  useEffect(() => {
    if (!isScannerOpen) { setScanning(true); setResult(null); return; }
    const t = setTimeout(() => {
      const idx = Math.floor(Math.random() * mockProducts.length);
      const product = mockProducts[idx] ?? null;
      setResult({ sku: product?.sku ?? 'UNKNOWN', product });
      setScanning(false);
    }, 2500);
    return () => clearTimeout(t);
  }, [isScannerOpen]);

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsScannerOpen(false)} />
      <div className="relative glass rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-white">📷 Barcode Scanner</h3>
            <p className="text-xs text-indigo-700 dark:text-white/55 mt-0.5">Point camera at barcode or QR code</p>
          </div>
          <button onClick={() => setIsScannerOpen(false)} className="btn-glass w-8 h-8 rounded-xl flex items-center justify-center text-sm">✕</button>
        </div>

        {/* Camera viewfinder */}
        <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-black/50 mb-4 border-2 border-violet-500/50">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {/* Corner markers */}
          {['top-2 left-2 border-t-2 border-l-2', 'top-2 right-2 border-t-2 border-r-2',
            'bottom-2 left-2 border-b-2 border-l-2', 'bottom-2 right-2 border-b-2 border-r-2'].map((c, i) => (
            <div key={i} className={`absolute w-6 h-6 border-violet-400 ${c}`} />
          ))}

          {scanning && (
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent scan-line left-0 shadow-[0_0_10px_2px_rgba(139,92,246,0.8)]" />
          )}

          {!scanning && result && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-white font-bold text-sm">{result.sku}</div>
              </div>
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-violet-300 text-xs animate-pulse">Scanning...</span>
            </div>
          )}
        </div>

        {/* Result */}
        {result?.product && (
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-indigo-900 dark:text-white text-sm">{result.product.name}</div>
                <div className="text-xs text-indigo-700 dark:text-white/55 mt-1">SKU: {result.product.sku}</div>
                {result.product.rack && <div className="text-xs text-indigo-700 dark:text-white/55">Rack: {result.product.rack}</div>}
              </div>
              <div className="text-right">
                <div className="font-bold text-violet-600 dark:text-violet-400 text-lg">₹{result.product.price}</div>
                <div className={`text-xs font-medium mt-1 ${result.product.quantity < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {result.product.quantity} {result.product.unit}s
                </div>
              </div>
            </div>
            {result.product.expiryDate && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  ⏰ Exp: {result.product.expiryDate}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setScanning(true); setResult(null); setTimeout(() => { const idx = Math.floor(Math.random() * mockProducts.length); const p = mockProducts[idx] ?? null; setResult({ sku: p?.sku ?? 'UNKNOWN', product: p }); setScanning(false); }, 2000); }}
            className="btn-glass py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">
            🔄 Scan Again
          </button>
          <button onClick={() => setIsScannerOpen(false)} className="btn-primary py-2.5 rounded-xl text-sm font-semibold">
            Add to Cart →
          </button>
        </div>
      </div>
    </div>
  );
}
