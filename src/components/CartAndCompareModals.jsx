import React from 'react';
import {
  X,
  ShoppingBag,
  GitCompare,
  Trash2,
  ArrowRight,
  Minus,
  FileText
} from 'lucide-react';
import ProductImage from './ProductImage';

export function QuoteCartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToForm
}) {
  if (!isOpen) return null;

  const totalUnits = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full shadow-hover flex flex-col justify-between p-5 sm:p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-red-50 text-[#E60012] shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  B2B Proje Teklif Sepeti
                </h3>
                <p className="text-xs text-slate-500">
                  Toplam {cartItems.length} model ({totalUnits} adet cihaz)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items List */}
          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Teklif sepetinizde henüz ürün yok
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Katalogdaki ürün kartlarında yer alan "Teklif Sepeti" butonuna tıklayarak proje listenizi oluşturabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              {cartItems.map(({ product, qty }) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3.5"
                >
                  <div className="w-14 h-14 rounded-xl bg-white p-1.5 border border-slate-200/60 flex items-center justify-center shrink-0">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.model}
                      model={product.model}
                      category={product.category}
                      className="max-h-11 w-auto object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {product.model}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {product.subcategory}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, Math.max(1, qty - 1))}
                        className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) =>
                          onUpdateQty(product.id, Math.max(1, Number(e.target.value)))
                        }
                        className="w-14 text-center text-xs font-bold py-1 rounded border border-slate-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, qty + 5)}
                        className="px-1.5 h-6 rounded bg-white border border-slate-300 text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                        title="+5 Adet Ekle"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 shrink-0"
                    title="Ürünü Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <button
              type="button"
              onClick={onProceedToForm}
              className="w-full py-3.5 px-4 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Teklif Formuna Aktar &amp; Fiyat İste</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClearCart}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-red-600"
            >
              Sepeti Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CompareModal({
  isOpen,
  onClose,
  compareProducts,
  onRemoveCompare,
  onClearCompare,
  onInquireProduct
}) {
  if (!isOpen) return null;

  const SPEC_ROWS = [
    { key: 'screen', label: 'Ekran Yapısı' },
    { key: 'sipLines', label: 'SIP Hat Sayısı' },
    { key: 'dssKeys', label: 'DSS / Programlanabilir Tuş' },
    { key: 'connectivity', label: 'Ağ & Kablosuz Bağlantı' },
    { key: 'poe', label: 'PoE / Güç Beslemesi' },
    { key: 'protection', label: 'Koruma Sınıfı / Gövde' },
    { key: 'audioVideo', label: 'Ses & Video Özellikleri' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-6xl w-full p-4 sm:p-7 shadow-hover max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Responsive Header (Never wraps awkwardly) */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-50 text-[#0284C7] shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 truncate">
                Model Karşılaştırma ({compareProducts.length}/4)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Seçilen Fanvil &amp; LINKVIL modellerinin teknik kıyaslaması
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {compareProducts.length > 0 && (
              <button
                type="button"
                onClick={onClearCompare}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#E60012] text-xs font-bold whitespace-nowrap transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto pt-4 pr-0.5 space-y-5">
          {compareProducts.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <GitCompare className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Karşılaştırma listeniz boş
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ürün kataloğundaki kartların sağ üst köşesinde yer alan "Karşılaştır" butonuna tıklayarak ürünleri buraya ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW (< md): Stacked Spec Cards with 2-Column Model Grid (Zero horizontal cutoff!) */}
              <div className="md:hidden space-y-4 pb-4">
                {/* Selected Models 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {compareProducts.map((p) => (
                    <div
                      key={p.id}
                      className="relative bg-slate-50 rounded-2xl p-3 border border-slate-200/90 flex flex-col items-center text-center"
                    >
                      <button
                        type="button"
                        onClick={() => onRemoveCompare(p.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white text-slate-400 hover:text-red-600 shadow-sm"
                        title="Kaldır"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-16 flex items-center justify-center my-1">
                        <ProductImage
                          src={p.imageUrl}
                          alt={p.model}
                          model={p.model}
                          category={p.category}
                          className="max-h-14 w-auto object-contain"
                        />
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs line-clamp-1">
                        {p.model}
                      </div>
                      <div className="text-[10px] text-[#0284C7] font-bold">
                        {p.series}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onInquireProduct(p.model);
                        }}
                        className="mt-2 w-full py-1.5 px-2 rounded-lg bg-[#E60012] text-white font-bold text-[11px]"
                      >
                        Bilgi Al
                      </button>
                    </div>
                  ))}
                </div>

                {/* Spec Comparison Cards for Mobile */}
                <div className="space-y-3">
                  {SPEC_ROWS.map((row) => (
                    <div
                      key={row.key}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                    >
                      <div className="bg-slate-900 text-white px-3.5 py-2 text-xs font-extrabold">
                        {row.label}
                      </div>
                      <div className="grid grid-cols-1 divide-y divide-slate-100">
                        {compareProducts.map((p) => (
                          <div
                            key={p.id}
                            className="px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs"
                          >
                            <span className="font-bold text-slate-900 shrink-0">
                              {p.model}:
                            </span>
                            <span className="text-slate-600 text-right font-medium">
                              {p.compareSpecs?.[row.key] || '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESKTOP VIEW (>= md): Side-by-Side Comparison Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-4 px-3 w-44 text-slate-500 font-bold uppercase tracking-wider">
                        Model &amp; Görsel
                      </th>
                      {compareProducts.map((p) => (
                        <th key={p.id} className="py-4 px-3 align-top">
                          <div className="relative bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
                            <button
                              type="button"
                              onClick={() => onRemoveCompare(p.id)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-white text-slate-400 hover:text-red-600 shadow-sm"
                              title="Kaldır"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="h-24 flex items-center justify-center mb-2">
                              <ProductImage
                                src={p.imageUrl}
                                alt={p.model}
                                model={p.model}
                                category={p.category}
                                className="max-h-20 w-auto object-contain"
                              />
                            </div>
                            <div className="font-extrabold text-slate-900 text-sm">
                              {p.model}
                            </div>
                            <div className="text-[11px] text-[#0284C7] font-semibold mt-0.5">
                              {p.series}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onInquireProduct(p.model);
                              }}
                              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white font-bold text-xs transition-colors"
                            >
                              Bilgi Al
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {SPEC_ROWS.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-3 font-bold text-slate-900 bg-slate-50/50">
                          {row.label}
                        </td>
                        {compareProducts.map((p) => (
                          <td key={p.id} className="py-3.5 px-4 text-slate-700 font-medium">
                            {p.compareSpecs?.[row.key] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
