import React, { useState } from 'react';
import { Phone, Shield, Wifi, Volume2, Cpu } from 'lucide-react';

export default function ProductImage({ src, alt, category, model, className = "w-full h-48 object-contain" }) {
  const [hasError, setHasError] = useState(false);

  const getCategoryIcon = () => {
    if (category?.includes("LINKVIL")) return <Wifi className="w-12 h-12 text-[#0284C7]" />;
    if (category?.includes("Güvenlik") || category?.includes("İnterkom")) return <Shield className="w-12 h-12 text-[#E60012]" />;
    if (category?.includes("Hoparlör")) return <Volume2 className="w-12 h-12 text-amber-600" />;
    if (category?.includes("Otel") || category?.includes("2-Wire")) return <Cpu className="w-12 h-12 text-emerald-600" />;
    return <Phone className="w-12 h-12 text-[#E60012]" />;
  };

  if (hasError || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 text-center border border-slate-200/60 ${className}`}>
        <div className="p-3.5 rounded-2xl bg-white shadow-sm mb-2.5">
          {getCategoryIcon()}
        </div>
        <span className="text-xs font-bold text-slate-800 line-clamp-1">{model || alt}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">{category}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || model}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
