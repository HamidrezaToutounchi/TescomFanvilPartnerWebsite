import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  ShoppingBag,
  GitCompare,
  FileText,
  ExternalLink,
  Check,
  Info,
  X
} from 'lucide-react';
import ProductImage from './ProductImage';

const CATEGORIES = [
  'Tümü',
  'Kurumsal SIP Telefonlar',
  'Otel & 2-Wire Çözümleri',
  'LINKVIL Kablosuz UC',
  'SIP Güvenlik, İnterkom & Sağlık',
  'SIP Hoparlör, Paging & Gateway'
];

const SERIES_LIST = [
  'Tümü',
  'V Serisi',
  'A Serisi Konsol',
  'X/XU Serisi',
  'X300 Serisi',
  'H Serisi',
  '2-Wire Serisi',
  'LINKVIL',
  'Kulaklık & UC',
  'i6 Kapı İnterkom',
  'i500 İç İstasyon',
  'Sağlık / Konsol',
  'SIP İnterkom',
  'SIP Hoparlör/PA',
  '2-Wire/Gateway',
  'Bulut & Aksesuar'
];

const FEATURE_TAGS = [
  'Wi-Fi',
  'Bluetooth',
  'PoE',
  'Gigabit',
  '2-Wire',
  'Dokunmatik Android',
  'Renkli LCD',
  'IP65/IP66/IP67',
  'IK10',
  'Antibakteriyel',
  'Kameralı',
  'Kompakt'
];

export default function ProductCatalog({
  products,
  selectedCategory,
  selectedSeries,
  onChangeCategory,
  onChangeSeries,
  cartItems,
  onAddToCart,
  compareIds,
  onToggleCompare,
  onInquireProduct
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [detailProduct, setDetailProduct] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    onChangeCategory('Tümü');
    onChangeSeries('Tümü');
    setSearchQuery('');
    setActiveTags([]);
  };

  // Count how many products belong to each series
  const seriesCounts = useMemo(() => {
    const counts = { Tümü: products.length };
    for (const s of SERIES_LIST) {
      if (s !== 'Tümü') {
        counts[s] = products.filter((p) => p.series === s).length;
      }
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'Tümü' && p.category !== selectedCategory) {
        return false;
      }
      if (selectedSeries !== 'Tümü' && p.series !== selectedSeries) {
        return false;
      }
      if (activeTags.length > 0) {
        const hasAll = activeTags.every((t) => p.highlights?.includes(t));
        if (!hasAll) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inModel = p.model.toLowerCase().includes(q);
        const inDesc = p.shortDescription.toLowerCase().includes(q);
        const inSub = p.subcategory.toLowerCase().includes(q);
        const inSeries = p.series.toLowerCase().includes(q);
        const inSpecs = Object.values(p.specs || {})
          .join(' ')
          .toLowerCase()
          .includes(q);
        return inModel || inDesc || inSub || inSeries || inSpecs;
      }
      return true;
    });
  }, [products, selectedCategory, selectedSeries, activeTags, searchQuery]);

  const isInCart = (id) => cartItems.some((item) => item.product.id === id);

  return (
    <section id="katalog" className="py-16 lg:py-20 bg-[#F8FAFC] scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E60012]">
              Fanvil &amp; LINKVIL Eksiksiz Resmi Ürün Kataloğu
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Tüm Fanvil &amp; LINKVIL Ürün Ailesi (120+ Model)
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              İlgilendiğiniz ürün için doğrudan <strong>"Bilgi Al"</strong> butonuna tıklayabilir, teklif sepetine ekleyebilir veya modelleri karşılaştırabilirsiniz.
            </p>
          </div>

          {/* Live Search Input */}
          <div className="w-full lg:w-96 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Model ara (örn. V67, A320i, i68, W626W, H603W, PA3)..."
              className="w-full pl-10 pr-9 py-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#E60012] focus:ring-2 focus:ring-[#E60012]/15 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Bar (Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onChangeCategory(cat);
                  onChangeSeries('Tümü');
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#E60012] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 shadow-sm"
          >
            <span className="inline-flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#E60012]" />
              <span>
                Ürün Serisi &amp; Özellik Filtreleri{' '}
                {selectedSeries !== 'Tümü' ? `(${selectedSeries})` : ''}
              </span>
            </span>
            <span className="text-xs font-extrabold text-[#E60012]">
              {mobileFiltersOpen ? 'Gizle ▲' : 'Tümünü Gör ▼'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Filter Sidebar - ALL SERIES VISIBLE WITHOUT SCROLLBAR CLIPPING */}
          <aside
            className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 space-y-6 shadow-sm ${
              mobileFiltersOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Filter className="w-4 h-4 text-[#E60012]" />
                <span>Filtreleme Motoru</span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#E60012] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            </div>

            {/* Product Series Filter - ALL items fully visible (no max-h overflow clipping!) */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                Ürün Serisi ({SERIES_LIST.length - 1} Seri)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                {SERIES_LIST.map((series) => {
                  const active = selectedSeries === series;
                  return (
                    <button
                      key={series}
                      type="button"
                      onClick={() => {
                        onChangeSeries(series);
                        if (series !== 'Tümü') {
                          onChangeCategory('Tümü');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between gap-1 ${
                        active
                          ? 'bg-red-50 text-[#E60012] font-bold border border-red-200/60'
                          : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{series}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            active
                              ? 'bg-[#E60012] text-white font-bold'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {seriesCounts[series] || 0}
                        </span>
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technical Features & Protection Tags */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
                Bağlantı, Ekran &amp; Koruma
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {FEATURE_TAGS.map((tag) => {
                  const selected = activeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Product Grid (9 Cols) */}
          <div className="lg:col-span-9">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-slate-600">
              <span>
                Toplam <strong className="text-slate-900">{filteredProducts.length}</strong> Fanvil &amp; LINKVIL ürün grubu listeleniyor
              </span>
              {(selectedCategory !== 'Tümü' ||
                selectedSeries !== 'Tümü' ||
                activeTags.length > 0 ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[#E60012] font-bold hover:underline"
                >
                  Tüm Filtreleri Temizle
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-800">
                  Arama kriterlerinize uygun ürün bulunamadı.
                </p>
                <p className="text-xs text-slate-500">
                  Filtreleri sıfırlayarak tüm kataloğu görüntüleyebilir veya özel model talebiniz için bilgi formunu doldurabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-[#E60012] text-white text-xs font-bold"
                >
                  Filtreleri Sıfırla
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const inCart = isInCart(product.id);
                  const inCompare = compareIds.includes(product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-soft transition-all flex flex-col overflow-hidden group"
                    >
                      {/* Top Bar: Badge & Compare Toggle */}
                      <div className="p-4 pb-0 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#E60012] text-[11px] font-bold truncate">
                          {product.badge || product.series}
                        </span>

                        <button
                          type="button"
                          onClick={() => onToggleCompare(product.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border shrink-0 transition-colors ${
                            inCompare
                              ? 'bg-[#0284C7] text-white border-[#0284C7]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                          title="Karşılaştırma listesine ekle/çıkar"
                        >
                          <GitCompare className="w-3 h-3" />
                          <span>{inCompare ? 'Seçildi' : 'Karşılaştır'}</span>
                        </button>
                      </div>

                      {/* Product Image */}
                      <div
                        onClick={() => setDetailProduct(product)}
                        className="p-5 flex items-center justify-center h-48 cursor-pointer"
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.model}
                          model={product.model}
                          category={product.category}
                          className="max-h-40 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Content */}
                      <div className="px-5 pb-5 flex-1 flex flex-col">
                        <div className="text-[11px] font-bold text-[#0284C7] uppercase tracking-wide truncate">
                          {product.subcategory}
                        </div>
                        <h3
                          onClick={() => setDetailProduct(product)}
                          className="text-base font-extrabold text-slate-900 mt-0.5 hover:text-[#E60012] cursor-pointer transition-colors"
                        >
                          {product.model}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                          {product.shortDescription}
                        </p>

                        {/* Highlights Chips */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {product.highlights?.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {/* Bilgi Al (Scrolls directly to Inquiry Form Card & Pre-fills) */}
                            <button
                              type="button"
                              onClick={() => onInquireProduct(product.model)}
                              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs font-bold transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Bilgi Al</span>
                            </button>

                            {/* Add to Quote Cart */}
                            <button
                              type="button"
                              onClick={() => onAddToCart(product)}
                              className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                                inCart
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                              }`}
                            >
                              {inCart ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Sepette</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>Teklif Sepeti</span>
                                </>
                              )}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDetailProduct(product)}
                            className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center justify-center gap-1 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Teknik Özellikleri İncele</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Specification Detail Modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-hover relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setDetailProduct(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-5 bg-slate-50 rounded-2xl p-4 flex items-center justify-center h-52">
                <ProductImage
                  src={detailProduct.imageUrl}
                  alt={detailProduct.model}
                  model={detailProduct.model}
                  category={detailProduct.category}
                  className="max-h-44 w-auto object-contain"
                />
              </div>
              <div className="sm:col-span-7 space-y-2">
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#E60012] text-xs font-bold">
                  {detailProduct.category}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">{detailProduct.model}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {detailProduct.shortDescription}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                Detaylı Teknik Özellikler
              </h4>
              <div className="space-y-2.5">
                {Object.entries(detailProduct.specs || {}).map(([key, val]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs"
                  >
                    <span className="font-bold text-slate-900">{key}</span>
                    <span className="sm:col-span-2 text-slate-700">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <a
                href={detailProduct.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:underline"
              >
                <span>Fanvil Resmi Ürün Sayfası</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(detailProduct);
                    setDetailProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Teklif Sepetine Ekle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const modelName = detailProduct.model;
                    setDetailProduct(null);
                    onInquireProduct(modelName);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#E60012] hover:bg-[#B9000E] text-white text-xs font-bold"
                >
                  Bu Ürün Hakkında Bilgi Al
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
